### Task: Upgrade the "Join Aarthika" staff application flow to simulate a professional multi-district experience and capture staff readiness for ground-level work.

### 🎯 Functional Requirements:

1. **Triggering the Form:**
   - When the user clicks on the “Join Aarthika” button in the Contact section, show a **processing/loading animation** that says:
     ```
     Detecting nearest Aarthika branch...
     ```
   - Duration of the fake fetch: **2 seconds**.
   - After 2 seconds, transition to a screen that says:
     ```
     Your nearest work location is:
     - Kishanganj
     - Dharampur
     - Debiganj
     ```
     *(Styled neatly like a multi-location company.)*

2. **Then show the form below with this heading:**

---

### 🧾 Fields to include in the form (use dropdowns and text where needed):

**Section: Personal Info**
- Full Name *(text)*
- Phone Number *(number)*
- Email *(email)*
- Village / Town *(text)*
- Preferred Work Location *(dropdown: Kishanganj, Debiganj, Dharampur, Other)*

**Section: Skills & Suitability**
- Can you use a smartphone confidently? *(dropdown)*
- Yes, very comfortably  
- Yes, with some help  
- No, but willing to learn  
- No

- Have you used mobile apps before? *(dropdown)*
- Yes (WhatsApp, YouTube, etc.)  
- Occasionally  
- Rarely  
- Never

- If trained for 2 days, can you manage data in Aarthika app? *(dropdown)*
- Yes  
- Maybe  
- Not sure  
- No

- How are your communication skills with rural customers? *(dropdown)*
- Excellent  
- Good  
- Average  
- Poor

- Have you handled cash, trust, or customer data before? *(dropdown)*
- Yes, in a finance or shop job  
- Yes, in general labor  
- No, but I’m responsible  
- No

**Section: Motivation**
- Why do you want to join Aarthika? *(paragraph)*

---

### 📤 Submission & Styling:
- Submit to Formspree: `https://formspree.io/f/mblgnlvv`
- Keep the design clean, professional, and aligned with the rest of the site.
- Make the fake fetch screen and actual form part of a single stateful component, maybe using `useState` and `setTimeout` for controlling visibility.

### 🛑 Important Constraints:
- Do not remove or affect the existing Contact form.
- This “Join Aarthika” flow should be **separate** from the general contact section.
