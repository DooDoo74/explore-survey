const STORAGE_KEY = "explore_trip_survey_answers";
const SUBMISSION_ID_KEY = "explore_trip_survey_submission_id";
const GOOGLE_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbz4_ir98blQ0FtR8JzKU40hUewnm8irsyVHHY1t0gLElSqywroqRboiRDRhMxmi_dt4/exec";

const ratingOptions = ["Excellent", "Good", "Satisfactory", "Poor", "Very Poor"];
const yesNo = ["Yes", "No"];
const yesNoNA = ["Yes", "No", "N/A"];

function ratingField(id, label) {
  return { id, label, type: "radio", options: ratingOptions };
}

function yesNoField(id, label) {
  return { id, label, type: "radio", options: yesNo };
}

function yesNoNAField(id, label) {
  return { id, label, type: "radio", options: yesNoNA };
}

function yesNoWithComments(id, label, commentLabel = "Comments") {
  return [
    { id, label, type: "radio", options: yesNo },
    { id: `${id}_comments`, label: commentLabel, type: "textarea" },
  ];
}

const surveyEl = document.getElementById("survey");
const navEl = document.getElementById("questionNav");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const searchInput = document.getElementById("searchInput");

const clearBtn = document.getElementById("clearBtn");
const navSaveBtn = document.getElementById("navSaveBtn");

const expandAllBtn = document.getElementById("expandAllBtn");
const collapseAllBtn = document.getElementById("collapseAllBtn");
const submitBtn = document.getElementById("submitBtn");
const submitStatus = document.getElementById("submitStatus");
const navSubmitStatus = document.getElementById("navSubmitStatus");
const mobileSubmitStatus = document.getElementById("mobileSubmitStatus");
const mobileSaveBtn = document.getElementById("mobileSaveBtn");
const pmSelect = document.getElementById("pmSelect");
const pmOtherWrap = document.getElementById("pmOtherWrap");
const pmOtherEmail = document.getElementById("pmOtherEmail");
const pmPanel = document.getElementById("pmPanel");
const mobileMenu = document.getElementById("mobileMenu");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const closeMobileMenuBtn = document.getElementById("closeMobileMenuBtn");
const mobileNav = document.getElementById("mobileNav");

const state = {
  answers: loadAnswers(),
  collapsed: new Set(),
};

let questions = [];
let submitEndpoint = GOOGLE_SHEETS_ENDPOINT;
let requiredComplete = false;

function loadAnswers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function getSubmissionId() {
  let id = localStorage.getItem(SUBMISSION_ID_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(SUBMISSION_ID_KEY, id);
  }
  return id;
}

function saveAnswers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
  updateProgress();
}

function isCommentField(field) {
  if (!field || !field.label) return false;
  const label = field.label.trim().toLowerCase();
  return label === "comments" || label.startsWith("comments");
}

function isOptionalField(field) {
  if (field.type === "action") return true;
  if (field.optional) return true;
  if (field.id && field.id.endsWith("_comments")) return true;
  return isCommentField(field);
}

function getHotelCount() {
  const raw = Number.parseInt(state.answers.tour_nights, 10);
  if (Number.isNaN(raw) || raw <= 0) {
    return 1;
  }
  return Math.min(raw, 30);
}

function getTransportCount() {
  const raw = Number.parseInt(state.answers.transport_count, 10);
  if (Number.isNaN(raw) || raw <= 0) {
    return 1;
  }
  return Math.min(raw, 10);
}

function buildQuestions() {
  const hotelCount = getHotelCount();
  const transportCount = getTransportCount();

  return [
    {
      id: "introduction",
      title: "Introduction",
      description: "Welcome to your BTY Report!",
      fields: [
        {
          id: "intro_ack",
          label: "I have read the introduction and understand the guidance",
          type: "radio",
          options: ["Yes"],
        },
        {
          id: "intro_notes",
          label: "Notes",
          type: "textarea",
          placeholder: "Optional notes about the introduction",
        },
      ],
    },
    {
      id: "your_details",
      title: "Your details",
      description: "Tell us about you and your tour.",
      fields: [
        { id: "your_name", label: "Your name", type: "text" },
        {
          id: "tour_code",
          label: "Tour code",
          type: "select",
          options: ["TBC"],
        },
        { id: "tour_start_date", label: "Tour start date", type: "date" },
        {
          id: "tour_nights",
          label: "Tour length (nights)",
          type: "number",
          placeholder: "e.g. 7",
        },
      ],
    },
    {
      id: "overall_experience",
      title: "Overall tour experience",
      description: "How was the trip overall?",
      fields: [ratingField("overall_rating", "Overall experience")],
    },
    {
      id: "overall_experience_comments",
      title: "Overall experience comments",
      description: "Tell us what you thought of the experience overall.",
      fields: [
        {
          id: "overall_comments",
          label: "Comments",
          type: "textarea",
        },
      ],
    },
    {
      id: "tour_itinerary",
      title: "Tour itinerary",
      description: "Itinerary feedback and accuracy.",
      fields: [
        ratingField("itinerary_rating", "Itinerary overall"),
        {
          id: "itinerary_as_per_notes",
          label:
            "Did the itinerary run as per the trip notes? If not, tell us on which day(s) it differed and how it actually ran",
          type: "textarea",
        },
        {
          id: "itinerary_improvements",
          label:
            "What worked? What could be improved? Should we spend more or less time in any locations? Do we need to review the inclusions?",
          type: "textarea",
        },
        {
          id: "travel_hours",
          label: "Approximation of the number of hours spent travelling each day",
          type: "textarea",
        },
        {
          id: "trip_highlights",
          label: "Trip highlights and once-in-a-lifetime moments",
          type: "textarea",
        },
        {
          id: "below_expectations",
          label: "Elements that fell below expectations",
          type: "textarea",
        },
        {
          id: "leader_itinerary_changes",
          label: "Did your tour leader mention any changes to improve the tour?",
          type: "textarea",
        },
        {
          id: "pace_grading",
          label:
            "Was the trip pace grading accurate? If walking/cycling, was the grade accurate? If not, tell us why",
          type: "textarea",
        },
      ],
    },
    {
      id: "tour_specifics_accommodation_intro",
      title: "Tour specifics: accommodation overview",
      description: "Hotel sections below are based on the tour length (nights).",
      fields: [
        {
          id: "accommodation_impression",
          label:
            "Overall impression of the accommodation. Was it in line with expectations based on trip notes?",
          type: "textarea",
        },
      ],
    },
    ...Array.from({ length: hotelCount }, (_, index) => {
      const number = index + 1;
      const prefix = `hotel_${number}`;
      return {
        id: `${prefix}`,
        title: `Hotel ${number}`,
        description: "Please provide detailed feedback for this hotel.",
        fields: [
          { id: `${prefix}_name`, label: "Hotel name", type: "text" },
          { id: `${prefix}_location`, label: "Hotel location", type: "text" },
          ratingField(`${prefix}_rating`, "How would you rate this hotel?"),
          {
            id: `${prefix}_comfort_grading`,
            label: "Was the comfort grading accurate based on your experience?",
            type: "textarea",
          },
          {
            id: `${prefix}_details`,
            label:
              "Tell us as much information as possible – facilities, food provision, room comfort, room facilities, air con/fans, pool, laundry service etc.",
            type: "textarea",
          },
          ...yesNoWithComments(
            `${prefix}_safety_briefing`,
            "Did your tour leader brief you on safety and what to do in the event of an emergency?"
          ),
          yesNoField(
            `${prefix}_evac_plan`,
            "Was there an emergency evacuation plan in your room?"
          ),
          yesNoField(
            `${prefix}_smoke_detector`,
            "Was there a working smoke detector in your room or hallway?"
          ),
          ...yesNoWithComments(
            `${prefix}_fire_exits`,
            "Were fire exits clearly marked and free from obstruction?"
          ),
          ...yesNoWithComments(
            `${prefix}_fire_extinguishers`,
            "Were there fire extinguishers - where?"
          ),
          ...yesNoWithComments(
            `${prefix}_alarm_points`,
            "Were there alarm activation points - where?"
          ),
          yesNoField(
            `${prefix}_emergency_lighting`,
            "Was there emergency lighting in corridors?"
          ),
          ...yesNoWithComments(
            `${prefix}_safety_equipment`,
            "Did you see any fire safety equipment such as extinguishers, alarm points or signage?"
          ),
          {
            id: `${prefix}_stories_staircases`,
            label:
              "How many stories were there including ground floor, and how many staircases?",
            type: "textarea",
          },
          ...yesNoWithComments(
            `${prefix}_second_staircase`,
            "If more than 3 stories, was there a second staircase as well as the main staircase?"
          ),
          ...yesNoWithComments(
            `${prefix}_gas_appliances`,
            "Were there any gas appliances or gas water heaters in your room?"
          ),
          yesNoNAField(
            `${prefix}_pool_depth_markings`,
            "If there was a swimming pool, did it have depth markings?"
          ),
          ...yesNoWithComments(
            `${prefix}_pool_rules`,
            "Were pool rules clearly displayed?"
          ),
          ...yesNoWithComments(
            `${prefix}_pool_rules_and_markings`,
            "If there was a swimming pool, did it have depth markings and were the pool rules clearly displayed?"
          ),
        ],
      };
    }),
    ...Array.from({ length: transportCount }, (_, index) => {
      const number = index + 1;
      const prefix = `transport_${number}`;
      const fields = [
        {
          id: `${prefix}_type`,
          label:
            "Transport type (e.g. 12-seater minibus, 50-seater coach, speedboat, large ferry)",
          type: "text",
        },
        {
          id: `${prefix}_days_used`,
          label: "Which day(s) was it used?",
          type: "textarea",
        },
        {
          id: `${prefix}_primary_vehicle`,
          label: "Describe the primary vehicle used for your tour",
          type: "textarea",
        },
        ...yesNoWithComments(
          `${prefix}_clean_comfortable`,
          "Was it clean, comfortable and was there sufficient space?"
        ),
        ...yesNoWithComments(
          `${prefix}_condition_safe`,
          "Did it seem to be in good condition and feel safe?"
        ),
        {
          id: `${prefix}_luggage_storage`,
          label: "Where was luggage stored (main luggage and day packs)?",
          type: "textarea",
        },
        ...yesNoWithComments(
          `${prefix}_seatbelts`,
          "For vehicles - were there working seatbelts on all seats?"
        ),
        ...yesNoWithComments(
          `${prefix}_seatbelt_reminder`,
          "Did your tour leader remind you to use the seatbelts?"
        ),
        ...yesNoWithComments(
          `${prefix}_driver_safety`,
          "Did you have any concerns about the safety of the driver (speeding or phone use)?"
        ),
        {
          id: `${prefix}_additional_vehicles`,
          label:
            "List any additional vehicles used for included or optional activities, days used, and safety concerns",
          type: "textarea",
        },
        {
          id: `${prefix}_vessels`,
          label:
            "List all vessels used for included or optional activities and indicate day(s) used",
          type: "textarea",
        },
        ...yesNoWithComments(
          `${prefix}_vessel_emergency_brief`,
          "For vessels - did the tour leader brief you on what to do in an emergency?"
        ),
        ...yesNoWithComments(
          `${prefix}_lifejackets`,
          "Was the location of lifejackets highlighted and were they accessible?"
        ),
        ...yesNoWithComments(
          `${prefix}_lifejacket_recommend`,
          "Did your tour leader recommend that you wear a lifejacket?"
        ),
      ];

      if (number === transportCount) {
        fields.push({
          id: "transport_add",
          label: "Add another transport",
          type: "action",
          action: "add_transport",
        });
      }

      return {
        id: `${prefix}`,
        title: `Transport ${number}`,
        description: "Please repeat for each transport type used.",
        fields,
      };
    }),
    {
      id: "equipment_optional_activities",
      title: "Equipment and optional activities",
      description: "Feedback on equipment and optional activities.",
      fields: [
        {
          id: "equipment_feedback",
          label:
            "Tell us about equipment used (bikes, tents, camping equipment). Was it in good condition, clean, safe?",
          type: "textarea",
        },
        {
          id: "optional_activities_offered",
          label:
            "Did your tour leader offer all optional activities listed in the trip notes? If not, which ones didn’t they offer?",
          type: "textarea",
        },
        {
          id: "optional_activity_prices",
          label:
            "Were the guideline prices for optional activities accurate? If not, what needs amending?",
          type: "textarea",
        },
        {
          id: "optional_activities_not_listed",
          label:
            "Did your tour leader offer optional activities not listed in the trip notes? If yes, details",
          type: "textarea",
        },
        ...yesNoWithComments(
          "optional_activities_taken",
          "Did you go on any optional activities? Did you pay the tour leader or local supplier?"
        ),
        ...yesNoWithComments(
          "waiver_forms",
          "Did you have to sign any waiver forms? If yes, for which activities"
        ),
        ...yesNoWithComments(
          "safety_briefings",
          "Did you receive safety briefings for all activities including swimming, snorkelling, walking/trekking and cycling?"
        ),
        {
          id: "safety_concerns",
          label:
            "Did you observe any safety concerns on the tour or did group members mention any? Please give details",
          type: "textarea",
        },
        {
          id: "meals_included",
          label: "What were the included meals like on your trip?",
          type: "textarea",
        },
        {
          id: "meals_suggested",
          label:
            "Where meals weren’t included, did your tour leader suggest and organise group meals?",
          type: "textarea",
        },
        {
          id: "restaurants",
          label:
            "What types of restaurants did your tour leader take you to? Authentic or touristy? Local food/drink specialities?",
          type: "textarea",
        },
      ],
    },
    {
      id: "tour_staff",
      title: "Tour staff",
      description: "Feedback on tour leader and local staff.",
      fields: [
        {
          id: "tour_leader",
          label: "Who was your tour leader?",
          type: "text",
        },
        ratingField("leader_communication", "Tour leader communication"),
        ratingField("leader_local_knowledge", "Tour leader local knowledge"),
        ratingField("leader_organisation", "Tour leader organisation"),
        ratingField("leader_friendliness", "Tour leader friendliness and approachability"),
        {
          id: "leader_impression",
          label: "Overall impression of your tour leader",
          type: "textarea",
        },
        {
          id: "leader_group_feedback",
          label: "What did your group members think of your tour leader?",
          type: "textarea",
        },
        {
          id: "local_staff",
          label:
            "If there were any other local staff (drivers, trekking staff, bike mechanic etc.), what did you think?",
          type: "textarea",
        },
        {
          id: "branded_items",
          label: "Did your tour leader wear or carry any branded items?",
          type: "textarea",
        },
      ],
    },
    {
      id: "trip_literature",
      title: "Trip literature",
      description: "Trip notes accuracy and content.",
      fields: [
        ratingField("trip_notes_accuracy", "Accuracy of the trip notes"),
        {
          id: "trip_notes_updates",
          label:
            "Anything we need to update, add or remove from any section of the trip notes",
          type: "textarea",
        },
        {
          id: "trip_notes_emphasise",
          label:
            "Elements to emphasise more in trip literature (positive or negative)",
          type: "textarea",
        },
        {
          id: "trip_notes_play_down",
          label: "Elements to play down in trip literature",
          type: "textarea",
        },
        {
          id: "trip_images",
          label:
            "Do we have the best images on the website? Should any be removed or added?",
          type: "textarea",
        },
        {
          id: "cost_lunch",
          label: "Cost of lunch (GBP, USD or AUD)",
          type: "text",
        },
        {
          id: "cost_dinner",
          label: "Cost of dinner (GBP, USD or AUD)",
          type: "text",
        },
        {
          id: "money_advice",
          label:
            "Advice about money (ATMs, credit cards, currency to take cash in)",
          type: "textarea",
        },
        {
          id: "tipping_kitty",
          label:
            "Did the tour leader organise a tipping kitty? Was the amount as per trip notes? Was it well managed?",
          type: "textarea",
        },
        {
          id: "packing_list",
          label: "Was the packing list accurate or could it be improved?",
          type: "textarea",
        },
      ],
    },
    {
      id: "sustainability",
      title: "Sustainability",
      description: "Impact on destinations and sustainability practices.",
      fields: [
        ratingField("sustain_protecting_environment", "Protecting the environment"),
        ratingField("sustain_minimising_waste", "Minimising waste"),
        ratingField("sustain_local_communities", "Connecting with local communities"),
        ratingField("sustain_local_economy", "Contributing to the local economy"),
        {
          id: "sustain_what_worked",
          label:
            "What did we do well (local interactions, waste-free picnics, local stores, off-peak visits, avoid single-use items)?",
          type: "textarea",
        },
        {
          id: "sustain_improvements",
          label:
            "Ideas about what we can do better or suggestions from the tour leader",
          type: "textarea",
        },
        {
          id: "animal_policy_explained",
          label: "Did your tour leader explain Explore’s Animal Protection Policy?",
          type: "radio",
          options: yesNoNA,
        },
        {
          id: "animal_policy_compliance",
          label: "Did wildlife experiences comply with the animal protection policy?",
          type: "radio",
          options: yesNo,
        },
        {
          id: "animal_policy_details",
          label: "If no, please provide details",
          type: "textarea",
        },
        {
          id: "plastic_bottles_actions",
          label:
            "How did your tour leader help minimise single-use plastic water bottles during the trip?",
          type: "checkbox",
          options: [
            "Large refill bottle on bus",
            "Pointed out refill points during the day",
            "Used refill app",
            "Didn’t mention it",
          ],
        },
        yesNoField(
          "plastic_bottles_provided",
          "Did they provide single-use plastic bottles?"
        ),
        {
          id: "carbon_reduction",
          label:
            "Ways to reduce carbon emissions (e.g. switch minibus transfers for trains)",
          type: "textarea",
        },
        ...yesNoWithComments(
          "foundation_initiatives",
          "Did you see any initiatives the Explore Foundation may want to support?",
          "If yes, provide the name, contact details and a short description"
        ),
      ],
    },
    {
      id: "your_group",
      title: "Your group",
      description: "Feedback on the group composition and dynamics.",
      fields: [
        {
          id: "group_size",
          label: "How many customers were in your group?",
          type: "select",
          options: Array.from({ length: 40 }, (_, i) => `${i + 1}`),
        },
        {
          id: "group_makeup",
          label:
            "Makeup of the group – ages, nationalities, sex, solos/couples/larger parties? Did the group gel well?",
          type: "textarea",
        },
        {
          id: "repeat_travelers",
          label:
            "How many times had people travelled with Explore previously and why did they choose Explore for this tour?",
          type: "textarea",
        },
        {
          id: "competitor_mentions",
          label:
            "Did anyone mention why they haven’t travelled with Explore or chose a competitor?",
          type: "textarea",
        },
        {
          id: "likely_complaints",
          label:
            "Are we likely to receive complaints? What is the issue and is it valid?",
          type: "textarea",
        },
        {
          id: "customer_relations",
          label:
            "Anything Customer Relations should be aware of regarding group members?",
          type: "textarea",
        },
        {
          id: "mobility_unsuitable",
          label:
            "Would this tour be unsuitable for customers with mobility issues or certain conditions (vertigo, claustrophobia)?",
          type: "textarea",
        },
        {
          id: "dietary_unsuitable",
          label:
            "Would this tour be unsuitable for customers who are vegetarian, vegan, gluten-free or lactose-free?",
          type: "textarea",
        },
      ],
    },
    {
      id: "general",
      title: "General",
      description: "Any final feedback or observations.",
      fields: [
        {
          id: "competitors_seen",
          label:
            "Did you come across any competitors? Details on group size, branding, transport, local staff, hotels, activities",
          type: "textarea",
        },
        {
          id: "bty_process_improvements",
          label: "Suggestions to improve the BTY trip process",
          type: "textarea",
        },
        {
          id: "other_feedback",
          label: "Any other feedback or observations to add",
          type: "textarea",
        },
        {
          id: "closing_ack",
          label:
            "Acknowledgement: I understand a copy will be sent to the listed recipients and I should forward it to the Product Manager and line manager",
          type: "radio",
          options: ["Yes"],
        },
      ],
    },
  ];
}

function renderSurvey() {
  questions = buildQuestions();
  surveyEl.innerHTML = "";
  navEl.innerHTML = "";
  mobileNav.innerHTML = "";

  questions.forEach((question, index) => {
    const card = document.createElement("article");
    card.className = "card";
    card.id = question.id;

    const header = document.createElement("div");
    header.className = "card__header";

    const titleWrap = document.createElement("div");

    const title = document.createElement("div");
    title.className = "card__title";
    title.textContent = `${index + 1}. ${getNavLabel(question)}`;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    meta.textContent = question.description || "";

    titleWrap.append(title, meta);

    const toggle = document.createElement("button");
    toggle.className = "card__toggle";
    toggle.type = "button";
    toggle.textContent = "Collapse";
    toggle.addEventListener("click", () => toggleCard(question.id));

    header.append(titleWrap, toggle);

    const body = document.createElement("div");
    body.className = "card__body";
    body.dataset.body = question.id;

    question.fields.forEach((field) => {
      const fieldWrap = document.createElement("div");
      fieldWrap.className = "field";

      const label = document.createElement("label");
      label.textContent = field.label;
      label.htmlFor = `${question.id}_${field.id}`;

      let input;
      if (field.type === "action") {
        const actionButton = document.createElement("button");
        actionButton.type = "button";
        actionButton.className = "ghost";
        actionButton.textContent = field.label;
        actionButton.addEventListener("click", () => handleAction(field));
        fieldWrap.append(actionButton);
        body.appendChild(fieldWrap);
        return;
      }

      if (field.type === "textarea") {
        input = document.createElement("textarea");
      } else if (field.type === "select") {
        input = document.createElement("select");
        const placeholderOption = document.createElement("option");
        placeholderOption.textContent = "Select";
        placeholderOption.value = "";
        input.appendChild(placeholderOption);
        field.options.forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option;
          opt.textContent = option;
          input.appendChild(opt);
        });
      } else if (field.type === "radio" || field.type === "checkbox") {
        input = document.createElement("div");
        input.className = "choice-group";
        field.options.forEach((option, optionIndex) => {
          const choice = document.createElement("label");
          choice.className = "choice";

          const choiceInput = document.createElement("input");
          choiceInput.type = field.type;
          choiceInput.name = `${question.id}_${field.id}`;
          choiceInput.value = option;
          choiceInput.id = `${question.id}_${field.id}_${optionIndex}`;

          if (field.type === "checkbox") {
            const values = state.answers[field.id] || [];
            choiceInput.checked = values.includes(option);
          } else {
            choiceInput.checked = state.answers[field.id] === option;
          }

          choiceInput.addEventListener("change", () => handleChoice(field, choiceInput));

          const choiceText = document.createElement("span");
          choiceText.textContent = option;

          choice.append(choiceInput, choiceText);
          input.appendChild(choice);
        });
      } else {
        input = document.createElement("input");
        input.type = field.type || "text";
      }

      if (input.tagName === "INPUT" || input.tagName === "TEXTAREA" || input.tagName === "SELECT") {
        input.id = `${question.id}_${field.id}`;
        input.placeholder = field.placeholder || "";
        input.value = state.answers[field.id] || "";
        input.addEventListener("input", () => handleInput(field, input.value));

        if (field.type === "number") {
          input.min = "1";
          input.max = "30";
          input.step = "1";
        }

        if (field.id === "tour_nights") {
          input.addEventListener("change", () => renderSurvey());
        }
      }

      fieldWrap.append(label, input);
      if (field.tag) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = field.tag;
        fieldWrap.appendChild(tag);
      }

      body.appendChild(fieldWrap);
    });

    card.append(header, body);
    card.dataset.index = `${index + 1}`;
    surveyEl.appendChild(card);

    const navButton = document.createElement("button");
    navButton.type = "button";
    navButton.textContent = getNavLabel(question);
    navButton.dataset.target = question.id;
    navButton.addEventListener("click", () => jumpTo(question.id));
    navEl.appendChild(navButton);

    const mobileButton = navButton.cloneNode(true);
    mobileButton.addEventListener("click", () => {
      jumpTo(question.id);
      closeMobileMenu();
    });
    mobileNav.appendChild(mobileButton);
  });

  updateCollapsed();
  updateProgress();
}

function handleInput(field, value) {
  if (value) {
    state.answers[field.id] = value;
  } else {
    delete state.answers[field.id];
  }
  saveAnswers();
  if (field.id && field.id.endsWith("_name")) {
    updateNavLabels(field.id);
  }
}

function handleChoice(field, input) {
  if (field.type === "checkbox") {
    const values = new Set(state.answers[field.id] || []);
    if (input.checked) {
      values.add(input.value);
    } else {
      values.delete(input.value);
    }
    state.answers[field.id] = Array.from(values);
  } else {
    state.answers[field.id] = input.value;
  }
  saveAnswers();
}

function handleAction(field) {
  if (field.action === "add_transport") {
    const count = getTransportCount();
    state.answers.transport_count = Math.min(count + 1, 10);
    saveAnswers();
    renderSurvey();
    const targetId = `transport_${state.answers.transport_count}`;
    jumpTo(targetId);
  }
}

function toggleCard(id) {
  if (state.collapsed.has(id)) {
    state.collapsed.delete(id);
  } else {
    state.collapsed.add(id);
  }
  updateCollapsed();
}

function updateCollapsed() {
  document.querySelectorAll(".card__body").forEach((body) => {
    const id = body.dataset.body;
    const collapsed = state.collapsed.has(id);
    body.classList.toggle("collapsed", collapsed);
    const toggle = body.parentElement.querySelector(".card__toggle");
    toggle.textContent = collapsed ? "Expand" : "Collapse";
  });
}

function updateProgress() {
  const totalFields = questions.reduce(
    (sum, q) => sum + q.fields.filter((field) => !isOptionalField(field)).length,
    0
  );
  const answeredFields = questions.reduce((sum, q) => {
    const count = q.fields.reduce((inner, field) => {
      if (isOptionalField(field)) {
        return inner;
      }
      const value = state.answers[field.id];
      if (Array.isArray(value)) {
        return inner + (value.length > 0 ? 1 : 0);
      }
      return inner + (value ? 1 : 0);
    }, 0);
    return sum + count;
  }, 0);

  const percent = totalFields === 0 ? 0 : Math.round((answeredFields / totalFields) * 100);
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}% complete`;

  requiredComplete = answeredFields >= totalFields && totalFields > 0;

  document.querySelectorAll(".nav button").forEach((button) => {
    const id = button.dataset.target;
    const question = questions.find((q) => q.id === id);
    const completed = question.fields.every((field) => {
      if (isOptionalField(field)) {
        return true;
      }
      const value = state.answers[field.id];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return Boolean(value);
    });
    button.classList.toggle("completed", completed);
  });

  document.querySelectorAll(".mobile-menu__nav button").forEach((button) => {
    const id = button.dataset.target;
    const question = questions.find((q) => q.id === id);
    const completed = question.fields.every((field) => {
      if (isOptionalField(field)) {
        return true;
      }
      const value = state.answers[field.id];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return Boolean(value);
    });
    button.classList.toggle("completed", completed);
  });

  const actionLabel = requiredComplete ? "Submit Full Survey" : "Save";
  submitBtn.textContent = actionLabel;
  navSaveBtn.textContent = actionLabel;
  mobileSaveBtn.textContent = actionLabel;
}

function getNavLabel(question) {
  if (question.id && question.id.startsWith("hotel_")) {
    const nameKey = `${question.id}_name`;
    const name = state.answers[nameKey];
    if (name) {
      return name;
    }
  }
  return question.title;
}

function updateNavLabels(fieldId) {
  const questionId = fieldId.replace(/_name$/, "");
  const question = questions.find((q) => q.id === questionId);
  if (!question) return;
  const label = getNavLabel(question);
  document.querySelectorAll(`[data-target="${questionId}"]`).forEach((button) => {
    button.textContent = label;
  });
  const card = document.getElementById(questionId);
  if (card) {
    const index = card.dataset.index || "";
    const titleEl = card.querySelector(".card__title");
    if (titleEl) {
      titleEl.textContent = `${index}. ${label}`;
    }
  }
}

function jumpTo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("highlight");
  setTimeout(() => target.classList.remove("highlight"), 600);
}

function openMobileMenu() {
  mobileMenu.classList.add("is-open");
  mobileMenu.setAttribute("aria-hidden", "false");
}

function closeMobileMenu() {
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
}

function flattenAnswers() {
  const flattened = {};
  questions.forEach((question) => {
    question.fields.forEach((field) => {
      if (field.type === "action") {
        return;
      }
      const key = field.id;
      const value = state.answers[key];
      if (Array.isArray(value)) {
        flattened[key] = value.join("; ");
      } else if (value !== undefined) {
        flattened[key] = value;
      } else {
        flattened[key] = "";
      }
    });
  });
  return flattened;
}

async function submitToSheet() {
  if (!submitEndpoint) {
    setSubmitStatus("Missing Google Sheets endpoint", "#b42318");
    return;
  }

  const pmEmail = getPmEmail();
  if (requiredComplete && !pmEmail) {
    setSubmitStatus("Select a Product Manager", "#b42318");
    focusPmPanel();
    return;
  }

  submitBtn.disabled = true;
  navSaveBtn.disabled = true;
  mobileSaveBtn.disabled = true;
  setSubmitStatus("Submitting...");

  const payload = {
    submission_id: getSubmissionId(),
    submitted_at: new Date().toISOString(),
    data: {
      ...flattenAnswers(),
      pm_choice: pmSelect.value || "",
      pm_email: pmEmail || "",
    },
    is_final: requiredComplete,
    pm_email: pmEmail || "",
  };

  try {
    const body = new URLSearchParams({
      payload: JSON.stringify(payload),
    });

    await fetch(submitEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });

    setSubmitStatus("Submitted (check sheet)", "#027a48");
  } catch (err) {
    setSubmitStatus("Submit failed", "#b42318");
  } finally {
    submitBtn.disabled = false;
    navSaveBtn.disabled = false;
    mobileSaveBtn.disabled = false;
  }
}

function setSubmitStatus(text, color = "") {
  submitStatus.textContent = text;
  submitStatus.style.color = color;
  navSubmitStatus.textContent = text;
  navSubmitStatus.style.color = color;
  mobileSubmitStatus.textContent = text;
  mobileSubmitStatus.style.color = color;
}

function getPmEmail() {
  const selection = pmSelect.value;
  if (!selection) return "";
  if (selection === "other") {
    const value = pmOtherEmail.value.trim();
    if (!value) return "";
    const lower = value.toLowerCase();
    if (!lower.endsWith("@explore.co.uk")) {
      return "";
    }
    return value;
  }
  return selection;
}

function togglePmOther() {
  const isOther = pmSelect.value === "other";
  pmOtherWrap.classList.toggle("is-visible", isOther);
  if (!isOther) {
    pmOtherEmail.value = "";
  }
}

function focusPmPanel() {
  if (!pmPanel) return;
  pmPanel.classList.add("is-highlighted");
  pmPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => pmPanel.classList.remove("is-highlighted"), 1500);
}

function syncPmState() {
  state.answers.pm_choice = pmSelect.value || "";
  state.answers.pm_email = pmOtherEmail.value.trim();
  saveAnswers();
}

searchInput.addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase().trim();
  const cards = Array.from(document.querySelectorAll(".card"));
  cards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    const match = text.includes(query);
    card.style.display = match ? "" : "none";
  });
  document.querySelectorAll(".nav button").forEach((button) => {
    const target = button.dataset.target;
    const card = document.getElementById(target);
    const visible = card && card.style.display !== "none";
    button.style.display = visible ? "" : "none";
  });

  document.querySelectorAll(".mobile-menu__nav button").forEach((button) => {
    const target = button.dataset.target;
    const card = document.getElementById(target);
    const visible = card && card.style.display !== "none";
    button.style.display = visible ? "" : "none";
  });
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Clear all answers?")) return;
  state.answers = {};
  saveAnswers();
  renderSurvey();
});

// Export dialog removed.

expandAllBtn.addEventListener("click", () => {
  state.collapsed.clear();
  updateCollapsed();
});

collapseAllBtn.addEventListener("click", () => {
  questions.forEach((q) => state.collapsed.add(q.id));
  updateCollapsed();
});

submitBtn.addEventListener("click", submitToSheet);
navSaveBtn.addEventListener("click", submitToSheet);
mobileSaveBtn.addEventListener("click", submitToSheet);
mobileMenuBtn.addEventListener("click", openMobileMenu);
closeMobileMenuBtn.addEventListener("click", closeMobileMenu);
mobileMenu.addEventListener("click", (event) => {
  if (event.target === mobileMenu) {
    closeMobileMenu();
  }
});
pmSelect.addEventListener("change", () => {
  togglePmOther();
  setSubmitStatus("Not submitted yet");
  syncPmState();
});
pmOtherEmail.addEventListener("input", () => {
  setSubmitStatus("Not submitted yet");
  syncPmState();
});

renderSurvey();
pmSelect.value = state.answers.pm_choice || "";
pmOtherEmail.value = state.answers.pm_email || "";
togglePmOther();
