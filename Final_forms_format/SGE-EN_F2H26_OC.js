// Once the document is ready
$(document).ready(function ()
{    
    

    // Function to set content for Page Language & Error Message
    // It is kept separate instead of being defined within setFieldData to provide handling in case data is not available in config for received language
    // If data is not available in config for received language, fallbackLanguage will be used
    function setPageContent()
    {
        // HTML Language
        $("html").attr("lang", language.substring(0, language.indexOf("_")));

        // Error Message container content
        var heading = "",
            subHeading = "",
            subHeadingUrl = "",
            subHeadingUrlText = "";

        try
        {
            heading = page_error[language]["hrErr"]["heading"];

            subHeading = page_error[language]["hrErr"]["subHeading"];

            subHeadingUrl = page_error[language]["hrErr"]["subHeadingUrl"];

            subHeadingUrlText = page_error[language]["hrErr"]["subHeadingUrlText"];
        }
        catch(err)
        {
            heading = page_error[param["fallbackLanguage"]]["hrErr"]["heading"];

            subHeading = page_error[param["fallbackLanguage"]]["hrErr"]["subHeading"];

            subHeadingUrl = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrl"];

            subHeadingUrlText = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrlText"];
        }
        finally
        {
            $("div#hrErr").find("h3").html(heading);

            $("div#hrErr").find("a").attr("href", subHeadingUrl);

            $("div#hrErr").find("a").html(subHeadingUrlText);

            $("div#hrErr").find("p").html(subHeading + $("div#hrErr").find("p").html());
        }
    }
    
    

    

    // Function to check all the Param(s) expected in URL are available or not
    function validateRequiredUrlParam()
    {
        if(recipientId == "" || recipientId == null || recipientId == undefined)
        {
            throw new Error("Recipient Id Missing");
        }
    }

    // Function to get value for passed key from fields JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder
    function setFieldData()
    {
        // Heading
        $("div.top_cont h2").html(fields[language]["headingBeforeBreak"] + $("div.top_cont h2").html() + fields[language]["headingAfterBreak"]);

        // Subheading
        $("div.top_cont p").html($("div.top_cont p").html() + fields[language]["requiredField"]);

        // Profile Field(s)
        $("div.form_top_group").find("div.form_text_bx").each(function()
        {
            // Field Label
            var pFormLabel = $(this).find("p.form_label");
            
            pFormLabel.html(fields[language]["label"][pFormLabel.parent().find("input, select").attr("id")] + pFormLabel.html());

            // Field Placeholder
            $(this).find("input, select").each(function()
            {
                if($(this).attr("placeholder") != undefined)
                {
                    $(this).attr("placeholder", fields[language]["placeholder"][$(this).attr("id")])
                }
            });
        });

        // Privacy Policy & Subscribe
        $("div.form_bottom_group > div.form_bottom_check_group").find("div.form_bottom_check").each(function()
        {
            // Label
            var ckbLabel = $(this).find("label");

            ckbLabel.html(fields[language][ckbLabel.attr("for")] + ckbLabel.html());

            // Link within Label
            var ckbLabelLink = ckbLabel.find("a");

            // Is present
            if(ckbLabelLink.length === 1)
            {
                ckbLabelLink.children("img").attr("alt", fields[language][ckbLabel.attr("for") + "Link"]["imageAlt"]);

                ckbLabelLink.children("img").attr("src", fields[language][ckbLabel.attr("for") + "Link"]["image"]);

                ckbLabelLink.html(fields[language][ckbLabel.attr("for") + "Link"]["label"] + ckbLabelLink.html());

                ckbLabelLink.attr("href", fields[language][ckbLabel.attr("for") + "Link"]["url"]);
            }
        });

        // Submit Button
        $("#btnSubmit").html(fields[language]["submitButton"]);
        
        // Thank You page / section
        $("div#hrTy").find("h3").html(fields[language]["hrTy"]["heading"]);

        $("div#hrTy").find("a").attr("href", fields[language]["hrTy"]["subHeadingUrl"]);

        $("div#hrTy").find("a").html(fields[language]["hrTy"]["subHeadingUrlText"]);

        $("div#hrTy").find("p").html(fields[language]["hrTy"]["subHeading"] + $("div#hrTy").find("p").html());
    }

    // Function to get value for passed key from questions & answers JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder
    function setQuestionAndAnswerData()
    {
        $("div.form_check_group > div.form_check_module").each(function()
        {
            var questionId = $(this).attr("id");

            // Question
            $(this).find("div.form_check_title h3").html(questions[language][questionId]["heading"] + $(this).find("div.form_check_title h3").html());

            $(this).find("div.form_check_title p").html(questions[language][questionId]["subheading"]);

            // Answer
            $(this).find("input[name='" + questionId + "']").each(function()
            {
                var input = $(this);

                var label = input.next();

                if (label.children().length == 0)
                {
                    // Answer with Text inside <label>
                    label.html(answers[language][questionId][input.val()]);
                }
                else if (label.children().length == 1)
                {
                    // Answer with Text inside <p> (within <label>)
                    label.children("p").html(answers[language][questionId][input.val()]);
                }
                else if (label.children().length == 2)
                {
                    // Answer with Text & Image (within <label>)
                    label.children("p").html(answers[language][questionId][input.val()]["label"]);

                    label.children("img").attr("src", answers[language][questionId][input.val()]["image"]);

                    label.children("img").attr("alt", answers[language][questionId][input.val()]["imageAlt"]);
                }
            });
        });
    }
	
	function setAnswerDataFromparam(q01)
	{
		//isSubmitClicked = true;
		$("#Q1"+q01).prop('checked', true);
	}

    // Function to get value for passed key from validation_messages JSON constant variable (present in Translation JS) based on Language AND set it as respective (Parsley) Validation Message
    function setValidationMessage()
    {
        $("input[data-parsley-error-message], select[data-parsley-error-message]").each(function()
        {
            $(this).attr("data-parsley-error-message", validation_messages[language][$(this).attr("id") + "Error"]);
        });

        $("input[data-parsley-type-message]").each(function()
        {
            $(this).attr("data-parsley-type-message", validation_messages[language][$(this).attr("id") + "Type"]);
        });

        $("input[data-parsley-length-message]").each(function()
        {
            $(this).attr("data-parsley-length-message", validation_messages[language][$(this).attr("id") + "Length"]);
        });

         $("#apiError").html(validation_messages[language]["apiError"]);
        $("#submitIntentPopupMessage1").text(validation_messages[language]["modalMessage_1"]);
        $("#submitIntentPopupMessage2").text(validation_messages[language]["modalMessage_2"]);
        $("#submitIntentPopupYes").text(validation_messages[language]["modalButtonYes"]);
        $("#submitIntentPopupNo").text(validation_messages[language]["modalButtonNo"]);
		
		$("input[data-parsley-mobile-number-by-country-message]").each(function()
        {
            $(this).attr("data-parsley-mobile-number-by-country-message", validation_messages[language][$(this).attr("id") + "Error"]);
        });
    }

    // Function to populate Calling Code dropdown
    function populateCallingCodeDropdown()
    {
        // Get Subsidiary from Country Code (parsed from Language)
        var subsidiary = country_subsidiary[countryCode];

        // Calling Code dropdown
        var ddCallingCode = $("#callingCode");

        // Set Default Value in Calling Code dropdown
        //ddCallingCode.append($("<option></option>").val("0").html(fields[language]["callingCodeDropdownFirstEntry"]));

        // Disable First / Default Entry in Calling Code dropdown
        $("#callingCode option:first-child").attr("disabled", "disabled").prop("selected", true);

        // Set Option(s) in Calling Code dropdown
        $.each(subsidiary_detail[subsidiary], function (val, text)
        {
            // If Calling Code is not blank
            if (text.callingCode != "")
            {
                ddCallingCode.append($("<option></option>").val(text.callingCode).html(text.countryName[language] + " (+" + text.callingCode + ")"));
            }
        });
    }

    // Function to reset selected value in Calling Code dropdown if Mobile Number is removed
    function resetCallingCode()
    {
        if($("#mobileNumber").val() == "")
        {
            // Reset value
            $("#callingCode").val("0");

            // Remove Parsley validation message
            $("#callingCode").parsley().reset();
        }
    }

    // Function to enable Submit button if both Privacy Policy & Subscribe checkboxes are checked (else keep Submit button disabled)
    function enableDisableSubmit()
    {
        if (($("#Q1A1").is(":checked") || $("#Q1A2").is(":checked") ||$("#Q1A3").is(":checked")))
        {
            $("#btnSubmit").prop("disabled", false);

            $("#btnSubmit").removeClass("disabled");
        }
        else
        {
            $("#btnSubmit").prop("disabled", true);

            $("#btnSubmit").addClass("disabled");
        }
    }

    function validateModal()
    {
        // Check whether any questions in the form have been answered
        submitModalAnsweredAny = $('[data-pt-api="y"][name^=Q]').filter((i, el) => el.checked).length > 0;

		//submitModalWithsub = $("#subscribe").is(":checked");
        return !submitModalHasOpened && !submitModalAnsweredAny;
    }

    function closeSubmitModalWithNo()
    {
        if (submitModalElement)
        {
            submitModalElement.removeClass("popup--open");
        }
    }
	
	function closeSubmitModalWithYes()
    {
		$("#subscribe").val("on");
        if (submitModalElement)
        {
            submitModalElement.removeClass("popup--open");
        }
        submitModalHasOpened = false;
    }

    function showSubmitModal(resumeCallback)
    {
        submitModalResume = typeof resumeCallback === "function" ? resumeCallback : null;

        if (!submitModalElement) // Bind events once
        {
            submitModalElement = $("#submitIntentPopup");
            submitModalElement.find("#submitIntentPopupYes, .popup__close, .popup__dimmed").on("click", closeSubmitModal);
            submitModalElement.find("#submitIntentPopupNo").on("click", function ()
            {
                closeSubmitModal();

                if (submitModalResume)
                {
                    submitModalResume();
                    submitModalResume = null;
                }
            });
        }

        submitModalElement.addClass("popup--open");
        submitModalHasOpened = true;
    }

    // Function to attach different event(s) to various element(s)
    function attachEvent()
    {
        // Add Parsley Custom Validator to validate Calling Code (value should be selected in dropdown if Mobile Number is entered)
        window.Parsley.addValidator("requiredIf", {
            validateString : function(value, requirement)
            {
                if($(requirement).parsley().isValid())
                {
                    if (jQuery(requirement).val())
                    {
                        return !!value;
                    }
                }

                return true;
            }
        });

		// Build callingCode -> countryCode mapping from subsidiary_detail
        var callingCodeToCountry = {};
        $.each(subsidiary_detail, function(subsidiary, countries) {
            $.each(countries, function(i, country) {
                if (country.callingCode && country.callingCode !== "") {
                    callingCodeToCountry[country.callingCode] = country.countryCode;
                }
            });
        });

        // Custom Parsley Validator - validate mobile number against selected calling code using libphonenumber-js
        window.Parsley.addValidator("mobileNumberByCountry", {
            validateString: function (value) {
                if (value.trim() === "") return true; // empty value handled by required-if on callingCode

                var callingCode = $("#callingCode").val();
                if (!callingCode || callingCode === "0") return false;

                // Check digit length by country: UAE allows 9 digits, others allow 8
                var trimmedValue = value.replace(/\s/g, "");
                if (callingCode === "971") {
                    if (trimmedValue.length !== 9) return false;
                } else {
                    if (trimmedValue.length !== 8) return false;
                }

                var fullNumber = "+" + callingCode + value;
                try {
                    var phoneNumber = libphonenumber.parsePhoneNumberFromString(fullNumber);
                    return phoneNumber && phoneNumber.isValid();
                } catch (e) {
                    return false;
                }
            },
            message: "Enter a valid mobile number"
        });
        // Clear / reset user entered data (from Profile fields)
        $(".btn_clear").on("click", function()
        {
            // Parent of element having btn_clear class
            var parent = $(this).parent();

            // Find input field present in parent container (having element with btn_clear class)
            var inputField = parent.find("input");

            // If input field is present
            if (inputField.length === 1)
            {
                // Reset input field value
                inputField.val("");

                // Remove Parsley validation message
                inputField.parsley().reset();

                // Find second parent (parent element's parent) of element having btn_clear class
                var secondParent = parent.parent();

                // Find dropdown field present in secodn parent container
                var ddSelect = secondParent.find("select");

                // If dropdown is present && is dependent on input field
                if((ddSelect.length === 1) && (ddSelect.attr("data-parsley-required-if") != undefined) && (ddSelect.attr("data-parsley-required-if") == ("#" + inputField.attr("id"))))
                {
                    // Reset dropdown value
                    ddSelect.val(secondParent.find("select option:first-child").val());

                    // Remove Parsley validation message
                    ddSelect.parsley().reset();
                }
            }
        });

        // Attach event to reset Calling Code if Mobile Number is removed
        $("#mobileNumber").on("change", resetCallingCode);

        // Attach event to check Submit button state (enabled / disabled) on check / uncheck of Privacy Policy & Subscribe checkboxes
        $("#Q1A1, #Q1A2, #Q1A3").on("change", enableDisableSubmit);
		//$("div.form_bottom_check_group input[type='checkbox'], #Q1A1, #Q1A2, #Q1A3").on("change", enableDisableSubmit);
        // Floating submit button (outside form) — trigger Parsley validation on click
        // $("#btnSubmit").on("click", function ()
        // {
            // var $form = $("#dataForm").parsley();

            // if ($form.isValid())
            // {
                // validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();
            // }
            // else
            // {
                // $form.validate();
            // }
        // });


        // For Calling Code & Mobile Number fields, override Parsley method to change DOM position of validation message
        window.Parsley.on('field:error', function()
        {
            if(this.$element.attr("id") == "callingCode")
            {
                $("#callingCode").parent().prev().after($("#callingCode").next("span.parsley-errors"));
            }

            if(this.$element.attr("id") == "mobileNumber")
            {
                $("#mobileNumber").before($("#mobileNumber").next("span.parsley-errors"));
				// Force red color on mobile number validation errors
                $("#mobileNumber").next("span.parsley-errors").find("span.parsley-error").css("color", "red");
            }
        });
    }

    // Function to carry out task(s) at the start of Form submit process
    function preSubmitProcess()
    {
		//submitFlag = true;
        // Disable Submit button
        $("#btnSubmit").attr("disabled", true).addClass("disabled");

        showOverlay();

        // Hide error message
        $("#apiError").hide();
    }

    // Function to show Overlay (with Loader)
    function showOverlay()
    {
        if( $("#overlay").css("display") == "none")
        {
            $("#overlay").css("display", "block");
        }
    }

    // Function to hide Overlay (with Loader)
    function hideOverlay()
    {
        if( $("#overlay").css("display") == "block")
        {
            $("#overlay").css("display", "none");
        }
    }

    // Function to show div confirming that data was successfully sent to server
    function showSuccess()
    {
        // Hide div having Form fields
        $("div.container_oc").css("display", "none");

        // Empty div (having Form fields)
        $("div.container_oc").empty();

        // Hide div having Error message
        $("#hrErr").css("display", "none");

        // Empty div (having Error message)
        $("#hrErr").empty();

        // Scroll to Top
        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });

        // Show div having Success message
        $("#hrTy").css("display", "block");

        // Set Timeout for Redirection
		window.top.location.href = fields[language]["redirectAfterSuccessUrl"];
        //setTimeout(function (){ window.top.location.href = fields[language]["redirectAfterSuccessUrl"]; }, (parseInt(param["redirectAfterSuccessInSecond"], 10) * 1000));

        hideOverlay();

        // Empty div (having Ovelary with Loader)
        $("#overlay").empty();

        // Adobe Analytics Tracking - Submit Form Event
        if (param?.analytics?.enabled) {
            _satellite.track("submit_form");
        }
    }

    // Function to show div informing about error
    function showError()
    {
        // Hide div having Form fields
        $("div.container_oc").css("display", "none");

        // Empty div (having Form fields)
        $("div.container_oc").empty();

        // Hide div having Success message
        $("#hrTy").css("display", "none");

        // Empty div (having Success message)
        $("#hrTy").empty();

        // Scroll to Top
        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });

        // Show div having Error message
        $("#hrErr").css("display", "block");

        hideOverlay();

        // Empty div (having Ovelary with Loader)
        $("#overlay").empty();
    }

    // Function to parse User Agent to get Platform Type
    function getPlatformType()
    {
        var userAgent = navigator.userAgent.toString();

        var platformType = "web";

        if(!!(window.EcommAndroidClient || window.flutter_inappwebview) || userAgent.indexOf('samsung-mobile-app') > -1)
        {
            platformType = "app";
        }

        return platformType;
    }

    // Function to Identify HHP using Calling Code & Mobile Number
    function identifyHHP(callingCode, mobileNumber)
    {
        var hhp =  "";

        if (callingCode != null && callingCode != "" && mobileNumber != "")
        {
            hhp = (callingCode + mobileNumber);
        }

        return hhp;
    }

    // Function to handle error occurred during API call
    function apiCallErrorHandler(isSubmitClicked)
    {
        if(isSubmitClicked)
        {
            // Show error message
            $("#apiError").show();

            // Enable Submit button so that user can try again
            enableDisableSubmit();

            // Scroll to Bottom
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });
        }

        hideOverlay();
    }
    

    // Function to Send Data to API
    function sendData(request, isSubmitClicked)
    {
        try
        {
            fetch(param["apiEndpoint"], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(request)
            })
            .then(response =>
            {
                if(!(response.ok) || response.status != "200")
                {
                    apiCallErrorHandler(isSubmitClicked);
                }
                else
                {
                    if(isSubmitClicked)
                    {
                        showSuccess();
                    }
                    else
                    {
                        hideOverlay();
                    }
                }
            }).
            catch(error =>
            {
                apiCallErrorHandler(isSubmitClicked);
            });
        }
        catch(err)
        {
            apiCallErrorHandler(isSubmitClicked);
        }
    }
 // iOS or MacOS íŒë³„ í•¨ìˆ˜
    function isIOS() {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        var iOSClassic = /iPhone|iPad|iPod/.test(ua);
        var iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        var MacOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints <= 1);
        var hasMacUA = /Macintosh/.test(ua) && !iPadOS;
        return iOSClassic || iPadOS || MacOS || hasMacUA;
    }
    // Function to create Request data based on User Input & call method to trigger API
    function mapParam(userResponse, isSubmitClicked)
    {
		if(isSubmitClicked === false ? userResponse["Q1"] = "": userResponse["Q1"] = userResponse["Q1"]);
        var dtmCurrent = new Date();

        var requestBody = {
            app_yn: (getPlatformType() === "app" ? "Y" : "N"),
			channel: ch === "" ? param["channel"]["oneClick"] : ch,
			channel_detail: chd === "" ? param["channelDetail"]["oneClick"] : chd,
            cid: userResponse["campaignId"],
            country_alpha_2: userResponse["countryCode"],
            deliveryId: userResponse["deliveryId"],
            email: userResponse["email"] || "",
            first_name: userResponse["firstName"] || "",
            hhp: identifyHHP(userResponse["callingCode"], userResponse["mobileNumber"]),
            imei: "",
            language: userResponse["language"],
            last_name: userResponse["lastName"] || "",
            mid: "",
            pin_code: userResponse["zipCode"] || "",
            privacy_policy_yn: "Y",//((isSubmitClicked === true) ? (userResponse["privacyPolicy"] === "on" ? "Y" : "N") : "Y"),
            project: param["project"],
            q01Answer: userResponse["Q1"],
            q02Answer: userResponse["Q2"],
            q03Answer: userResponse["Q3"],
            q04Answer: userResponse["Q4"],
            q05Answer: userResponse["Q5"],
            q06Answer: "",
            q07Answer: "",
            q08Answer: "",
            q09Answer: "",
            q10Answer: "",
            q11Answer: "",
            q12Answer: "",
            q13Answer: "",
            q14Answer: "",
            q15Answer: "",
            q16Answer: "",
            q17Answer: "",
            q18Answer: "",
            q19Answer: "",
            q20Answer: "",
            recipientId: userResponse["recipientId"],
            registerDatetime: dtmCurrent.toISOString(),
            source: param["source"]["oneClick"],
            subscribe_yn: "Y",//((isSubmitClicked === true) ? (userResponse["subscribe"] === "on" ? "Y" : "N") : "Y"),
            tm_yn: "",
            uniqueid: dtmCurrent.getTime() + "_" + crypto.randomUUID() + "_" + Math.floor(Math.random() * 1e12).toString().padStart(12, "0"),
            VoucherRequired: param["voucherRequired"],
			oneclickFlag: "Y",
            submitFlag: (isSubmitClicked === true ? "Y" : "N"),
            iosFlag: (isIOS() ? "Y" : "N")
        };

        sendData(requestBody, isSubmitClicked);
    }

    // Function to Process User Input & transfer flow for further processing
    // This methoed will be called:
    // 1 - When the page is viewed - This call will register Recipient as HR (blank / default data will be passed for form fields)
    // 2 - When user clicks the Submit button - This call will send User Response to API
    // Input variable received by this method is to differentiate between the 2 method calls mentioned above
    function processFormData(isSubmitClicked)
    {
        var formElements = document.getElementById("dataForm");

        var elementId,
            elementName,
            objectValue,
            cBrBData = {},
            formData = [],
            elementDataAttr,
            userResponse = {};

        // Process all the Form Fields
        for (i = 0; i < formElements.length; i++)
        {
            if (formElements.elements[i].type != "hidden")
            {
                elementId = formElements.elements[i].id;

                elementName = formElements.elements[i].name;

                elementDataAttr = formElements.elements[i].getAttribute("data-pt-api");

                if (elementDataAttr && elementDataAttr.trim() !== "" && elementDataAttr.trim() === "y")
                {
                    if (formElements.elements[i].type == "radio")
                    {
                        if (!cBrBData[elementName])
                        {
                            cBrBData[elementName] = [];
                        }

                        if ($("#" + elementId).is(":checked"))
                        {
                            cBrBData[elementName].push($("#" + elementId).val());
                        }
                    }
                    else if (formElements.elements[i].type == "checkbox")
                    {
                        if (!cBrBData[elementName])
                        {
                            cBrBData[elementName] = [];
                        }

                        if ($("#" + elementId).is(":checked"))
                        {
                            cBrBData[elementName].push($("#" + elementId).val());
                        }
                    }
                    else
                    {
                        objectValue = $("#" + elementId).val();

                        formData.push({name: elementName, value: objectValue});
                    }
                }
            }
        }

        Object.keys(cBrBData).forEach(function (key)
        {
            formData.push({ name: key, value: cBrBData[key].join("|") });
        });

        // Move data from Array to Key / Value pair
        for (var i=0, len=formData.length; i < len; i++)
        {
            userResponse[formData[i]["name"]] = formData[i]["value"];
        }

        // If Country Code dropdown is present in form, then pick the value from dropdown -- This is already handled above along with other fields (no special handling required).
        // If Country Code dropdown is not present in form, then pick the value from URL (parsed from Language).
        if(userResponse["countryCode"] == null || userResponse["countryCode"] == undefined)
        {
            userResponse["countryCode"] = countryCode;
        }

        // Add data determined earlier (from URL Parameter) to Key / Value pair
        userResponse["campaignId"] = campaignId;

        userResponse["deliveryId"] = deliveryId;

        userResponse["recipientId"] = recipientId;

        userResponse["language"] = language;
		
		userResponse["subscribe"] = $("#subscribe").val();
		
        userResponse["channel"] = ch;

        userResponse["channel_detail"] = chd;

        //userResponse["Q1"] = q01 === "" ? userResponse["Q1"]: q01;

        // Call function to map API Parameter with User Response & send data to server
        mapParam(userResponse, isSubmitClicked);
    }

    try
    {
        showOverlay();

        // Get Parameter Value from URL
        var frameUrlParam = new URLSearchParams(window.location.search);

        var language = frameUrlParam.get("lang") || param["fallbackLanguage"];

        var campaignId = frameUrlParam.get("cid") || "";

        var deliveryId = frameUrlParam.get("did") || "";

        var recipientId = frameUrlParam.get("id") || "";

        var countryCode = language.substring(language.indexOf("_") + 1);

		//Coomment-CEJ-q01 
        var q01 = frameUrlParam.get("q01") || "";	
		
		var ch = frameUrlParam.get("ch") || "";
			
		var chd = frameUrlParam.get("chd") || "";
		
		//var submitFlag = false;

        setPageContent();

        validateRequiredUrlParam();

        setFieldData();

        setQuestionAndAnswerData();

        setValidationMessage();

        populateCallingCodeDropdown();

        attachEvent();
		
		//Coomment-CEJ-q01 
		if(q01 !== "")
		{
			setAnswerDataFromparam(q01);
		}
		
		enableDisableSubmit();

        // Load and display submit modal when form is submitted, or none of answers are selected
        var submitModalElement = null;
        var submitModalResume = null;
        var submitModalHasOpened = false;
        var submitModalAnsweredAny = false;

        // Call method to send data to API and register Recipient as HR
        // Varaible false passed to method call confirms that the Submit button wasn't clicked
		processFormData(false);

        function processValidatedSubmit()
        {
            preSubmitProcess();

            // Varaible true passed to method call confirms that the Submit button wasn clicked
            processFormData(true);
        }

        var parsleyConfig = {
            errorsWrapper: '<span class="parsley-errors"></span>',
            errorTemplate: '<span class="parsley-error"></span>',
            excluded: 'input[type=button], input[type=submit], input[type=reset], input[type=hidden], input[class=noValidate]',
        }

        // Carry out following after the submit button is clicked
        $("#btnSubmit").on("click", function() {
            $("#dataForm").trigger("submit");
        });
        $("form").parsley(parsleyConfig).on("form:submit", function ()
        {
           validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();

           return false;
        });
    }
    catch(err)
    {
        showError();
    }
});

//OC_JS Final Update 08/07/2027 10:30:00 UAE
//All update align with MENAO and SUWON.
//All data tested.
//Commented on 08/07/2027 15:22:00 UAE
//Commented on 14/07/2027 11:22:00 UAE