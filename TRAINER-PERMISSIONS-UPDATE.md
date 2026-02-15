
# 🛠️ Trainer Permissions Update: Common Faults

## Overview
Trainer permissions have been expanded to include full management (Add, Update, Delete) of Common Faults, with strict vehicle allocation enforcement.

## Changes Implemented

### 1. Routes (`src/routes/diagnosis.routes.ts`)
- **POST `/common`**: Added `trainer` to authorized roles.
- **PUT `/common/:id`**: Added a new route for updating common faults, accessible by `trainer`.
- **DELETE `/common/:id`**: Added `trainer` to authorized roles.

### 2. Controller (`src/controllers/diagnosis.controller.ts`)
- **`createCommonFault`**: Ensures trainers can only assign faults to vehicles they are allocated to. trainer cannot create global faults.
- **`deleteCommonFault`**: Added logic to verify that the fault being deleted belongs to a vehicle the trainer has access to.
- **`updateCommonFault`**: Implemented a new function to handle updates, including:
    - Verifying trainer has access to the *existing* fault's vehicles.
    - Verifying trainer has access to the *new* vehicles being assigned.
    - Updating fault details, symptoms, and causes.

## Verification
Trainers should now be able to:
- Access the "Add Common Fault" modal and save new faults (for their vehicles).
- Delete faults that belong to their vehicles.
- (Backend Ready) Update faults if an edit UI is available or added in the future.
