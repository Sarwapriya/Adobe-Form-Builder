import type { ProfileFieldSet } from "../../../form/formDefinition.ts";

type ProfileInputFields = Pick<ProfileFieldSet, "email" | "firstName" | "lastName" | "countryCode" | "callingCode">;

/**
 * Renders the `.form_top_group` profile inputs. Each block is presence-driven: a
 * workbook that never defined a `firstName` row produces no first-name input at all.
 * All label/placeholder text stays empty here — behavior.js injects it at runtime.
 */
export function renderProfileFields(fields: ProfileInputFields): string {
  const parts: string[] = [];

  if (fields.countryCode) {
    parts.push(
      '<div class="form_text_bx select_bx">' +
        '<p class="form_label"></p>' +
        '<div class="select_wrap"><select autocomplete="off" id="countryCode" name="countryCode"></select></div>' +
        "</div>",
    );
  }

  if (fields.email) {
    parts.push(
      '<div class="form_text_bx">' +
        '<p class="form_label"><span></span><span class="star">*</span></p>' +
        '<div class="input_wrap">' +
        '<input type="email" id="email" name="email" autocomplete="off" spellcheck="false" required ' +
        'data-parsley-required="true" data-parsley-type="email" ' +
        "data-parsley-pattern=\"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\">" +
        '<div class="btn_clear"></div></div></div>',
    );
  }

  if (fields.firstName || fields.lastName) {
    const nameFields: string[] = [];
    if (fields.firstName) {
      nameFields.push(
        '<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p>' +
          '<div class="input_wrap"><input type="text" id="firstName" name="firstName" autocomplete="off" ' +
          'spellcheck="false" required data-parsley-required="true"><div class="btn_clear"></div></div></div>',
      );
    }
    if (fields.lastName) {
      nameFields.push(
        '<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p>' +
          '<div class="input_wrap"><input type="text" id="lastName" name="lastName" autocomplete="off" ' +
          'spellcheck="false" required data-parsley-required="true"><div class="btn_clear"></div></div></div>',
      );
    }
    parts.push(`<div class="form_text_group">${nameFields.join("")}</div>`);
  }

  if (fields.callingCode) {
    parts.push(
      '<div class="form_text_bx select_bx">' +
        '<p class="form_label"></p>' +
        '<div class="select_wrap">' +
        '<select autocomplete="off" id="callingCode" name="callingCode" data-parsley-required-if="#mobileNumber" ' +
        'data-parsley-validate-if-empty="true"></select>' +
        '<div class="input_wrap">' +
        '<input type="text" id="mobileNumber" name="mobileNumber" autocomplete="off" spellcheck="false" ' +
        'data-parsley-type="digits" data-parsley-mobile-number-by-country="true">' +
        "<div class=\"btn_clear\"></div></div></div></div>",
    );
  }

  return parts.join("");
}
