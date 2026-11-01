/* Keep checkout phone and delivery PIN input clear and valid on small screens. */
(function () {
  const fieldSelector = "input, textarea";
  const phoneWords = /phone|mobile|telephone|whatsapp/i;
  const addressWords = /address/i;
  const pinWords = /pin.?code|pincode|postal|postcode|zip/i;

  function fieldLabelText(field) {
    const labelText = field.labels
      ? Array.from(field.labels).map((label) => label.textContent).join(" ")
      : "";
    const wrappingLabel = field.closest("label");
    return `${labelText} ${wrappingLabel ? wrappingLabel.textContent : ""}`.toLowerCase();
  }

  function fieldDescription(field) {
    return [
      field.name,
      field.id,
      field.type,
      field.autocomplete,
      field.placeholder,
      fieldLabelText(field)
    ].join(" ").toLowerCase();
  }

  function findFields(form) {
    const fields = Array.from(form.querySelectorAll(fieldSelector));
    const mobile = fields.find((field) => phoneWords.test(fieldDescription(field))) ||
      fields.find((field) => field.type === "tel");
    const address = fields.find((field) => {
      const description = fieldDescription(field);
      const identity = [field.name, field.id, field.autocomplete].join(" ").toLowerCase();
      // Address placeholders may mention a PIN; use the field's name/id first.
      return addressWords.test(identity) ||
        (addressWords.test(description) && !pinWords.test(identity));
    });
    const pin = fields.find((field) => {
      const identity = [field.name, field.id, field.autocomplete].join(" ").toLowerCase();
      return pinWords.test(identity) || pinWords.test(fieldLabelText(field));
    });
    return { mobile, address, pin };
  }

  function addHint(field, text) {
    const container = field.parentElement;
    if (!container || container.querySelector(".vybein-checkout-hint")) return;
    const hint = document.createElement("small");
    hint.className = "vybein-checkout-hint";
    hint.textContent = text;
    field.insertAdjacentElement("afterend", hint);
  }

  function addPinField(form, addressField) {
    const wrapper = document.createElement("div");
    wrapper.className = "vybein-checkout-pin";

    const label = document.createElement("label");
    label.htmlFor = "vybeinDeliveryPin";
    label.textContent = "PIN code";

    const input = document.createElement("input");
    input.id = "vybeinDeliveryPin";
    input.name = "delivery_pincode";
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "postal-code";
    input.maxLength = 6;
    input.pattern = "[0-9]{6}";
    input.required = true;
    input.placeholder = "6-digit PIN code";
    input.setAttribute("aria-label", "6-digit delivery PIN code");

    wrapper.append(label, input);
    const addressContainer = addressField.closest(
      ".form-group, .form-field, .checkout-field, .input-group, .field"
    ) || addressField.closest("label") || addressField.parentElement;
    if (addressContainer && addressContainer !== form) {
      addressContainer.insertAdjacentElement("afterend", wrapper);
    } else {
      form.append(wrapper);
    }
    return input;
  }

  function enhanceForm(form) {
    const { mobile, address, pin: existingPin } = findFields(form);
    if (!mobile || !address) return;

    if (!mobile.dataset.vybeinTenDigit) {
      mobile.dataset.vybeinTenDigit = "true";
      mobile.type = "tel";
      mobile.inputMode = "numeric";
      mobile.autocomplete = "tel-national";
      mobile.minLength = 10;
      mobile.maxLength = 10;
      mobile.pattern = "[0-9]{10}";
      mobile.required = true;
      mobile.setAttribute("title", "Enter a 10-digit mobile number without +91.");
      if (!mobile.placeholder) mobile.placeholder = "10-digit mobile number";
      mobile.addEventListener("input", () => {
        let digits = mobile.value.replace(/\D/g, "");
        if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
        mobile.value = digits.slice(0, 10);
        mobile.setCustomValidity("");
      });
      addHint(mobile, "Enter 10 digits without +91.");
    }

    let pin = existingPin;
    if (!pin) pin = addPinField(form, address);
    if (pin && !pin.dataset.vybeinSixDigit) {
      pin.dataset.vybeinSixDigit = "true";
      pin.inputMode = "numeric";
      pin.maxLength = 6;
      pin.pattern = "[0-9]{6}";
      pin.required = true;
      pin.autocomplete = "postal-code";
      pin.addEventListener("input", () => {
        pin.value = pin.value.replace(/\D/g, "").slice(0, 6);
        pin.setCustomValidity("");
      });
      if (!pin.closest(".vybein-checkout-pin")) addHint(pin, "Enter the 6-digit delivery PIN code.");
    }
  }

  function checkoutForm(form) {
    return form instanceof HTMLFormElement && findFields(form).mobile && findFields(form).address;
  }

  document.querySelectorAll("form").forEach(enhanceForm);

  // Checkout fields can appear after the cart contents are drawn.
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches && node.matches("form")) enhanceForm(node);
        node.querySelectorAll && node.querySelectorAll("form").forEach(enhanceForm);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Run before the existing WhatsApp order handler so it receives the PIN too.
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!checkoutForm(form)) return;

    enhanceForm(form);
    const { mobile, address, pin } = findFields(form);
    if (!mobile || !address || !pin) return;

    const mobileDigits = mobile.value.replace(/\D/g, "");
    const pinDigits = pin.value.replace(/\D/g, "");
    mobile.value = mobileDigits;
    pin.value = pinDigits;
    mobile.setCustomValidity(mobileDigits.length === 10 ? "" : "Enter exactly 10 mobile digits.");
    pin.setCustomValidity(pinDigits.length === 6 ? "" : "Enter the 6-digit delivery PIN code.");

    const invalidField = mobileDigits.length !== 10 ? mobile : pinDigits.length !== 6 ? pin : null;
    if (invalidField) {
      event.preventDefault();
      event.stopImmediatePropagation();
      invalidField.reportValidity();
      return;
    }

    const originalAddress = address.value;
    address.value = `${originalAddress.trim()}\nPIN Code: ${pinDigits}`;
    requestAnimationFrame(() => {
      address.value = originalAddress;
    });
  }, true);
})();
