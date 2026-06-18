Screen Layout Workflow: Step-by-Step Implementation

To build your application frontend cleanly, you will configure two core layouts: the List Search View and the Deep Passbook View.

Screen 1: The Account Search & Registration Portal (List View) [1]

• The Interface: A clean search box sits at the top of your dashboard. Below it, your system displays a tabular, multi-row grid view.

• The Execution: When you type "Aman" or scan a face, your backend executes an exact database search query:
SELECT photo_file_path, full_name, fathers_name, village, phone_number, account_number FROM customer_profiles WHERE full_name LIKE '%Aman%';

• The Layout: The application iterates through the returned rows, rendering each customer profile cleanly as a structured line item card:

• 



Screen 2: The Deep Transaction Ledger Portal (Passbook View)

When you identify the correct "Aman" based on his photo, father's name, or village, clicking the [VIEW U] button triggers a state change in your application. The system captures that specific user's unique account_number and dynamically opens a deep ledger screen.

• The Top Panel: Displays the specific customer’s static details (Large Profile Photo, Full Name, Account Number, and Current Net Balance fetched from Table C).

• The Input Area: Two bold, simple text fields with confirmation buttons:

• [ Enter Deposit Amount ] -> [CONFIRM DEPOSIT] button

• [ Enter Withdrawal Amount ] -> [CONFIRM WITHDRAWAL] button

• The History Table: The bottom half of the screen displays a chronological passbook grid populated by running the query:
SELECT timestamp, type, amount FROM transaction_ledger WHERE account_number = X ORDER BY timestamp DESC;

