# Pro360 Engagement Rules - User Guide

## Overview
The Pro360 Engagement Rules page allows you to manage engagement and exposure rules for Pro360 campaigns with full version history tracking (SCD Type 2).

## How to Access
Navigate to: **Settings → Pro360 Eng Rules** in the sidebar

## Creating a New Rule

1. Click the **"Add New Rule"** button (top right)
2. Fill in the form:
   - **Event Name** (required): Unique identifier (e.g., `bcc_impression`, `dmu_impression`)
   - **Billing Type** (required): Select CPX, CPE, or CPVS
   - **Tactic Field** (optional): Field name (e.g., `zone`, `attr8`)
   - **Is Engagement** (required): Yes (1) or No (0)
   - **Is Exposure** (required): Yes (1) or No (0)
3. Click **"Create Rule"**

**Note:** New rules always start as **Active**. There is no option to create an inactive rule.

## Editing an Existing Rule

### How to Edit:
1. **Select a row** by clicking the **checkbox** on the left side of the data grid
2. Click the **"Edit"** button that appears in the action bar
3. Modify the fields you want to change
4. Click **"Update Rule"**

### What Happens When You Edit:
- Creates a **new version** of the rule (version number increments)
- Previous version is preserved in history
- **Status is preserved**: If the rule was inactive, the new version remains inactive

**Important:** 
- Event Name **cannot be changed** (it's the business key)
- Only the **latest version** can be edited
- Historical versions are read-only

## Activating/Inactivating Rules

### How to Activate/Inactivate:
1. **Select a row** by clicking the checkbox
2. Click **"Inactivate"** (for active rules) or **"Activate"** (for inactive rules)

### What Happens:
- Changes the status **without creating a new version**
- Updates `inactivatedAt` and `inactivatedBy` fields
- Only works on the **latest version**

## Viewing History

### Method 1: View History Toggle
1. Check the **"Show History"** checkbox at the top
2. All versions of all rules will be displayed

### Method 2: View Specific Rule History
1. **Select a row**
2. Click the **"View History"** button
3. Automatically switches to history view for that rule

## Deleting Rules

1. **Select a row**
2. Click the **"Delete"** button
3. Confirm the deletion

**Warning:** This deletes **all versions** of the rule permanently!

## Understanding the Data Grid

### Columns:
- **Checkbox**: Select rows for actions
- **Event Name**: Unique identifier
- **Billing Type**: CPX, CPE, or CPVS
- **Tactic Field**: Custom field name
- **Is Engagement**: Yes/No (color-coded)
- **Is Exposure**: Yes/No (color-coded)
- **Status**: 
  - 🟢 Green "Active (vX)" - Current active rule
  - 🔴 Red "Inactive (vX)" - Current inactive rule
  - ⚪ Gray "Historical (vX)" - Previous version
- **Version**: Version number
- **Modified By**: User who made the change
- **Updated At**: Timestamp of last change
- **Inactivated By**: User who inactivated (if applicable)

### Filter Options:
- **Active Only** (checked by default): Shows only active latest rules
- **Show History**: Shows all versions of all rules

## Business Rules

1. **Event Name is Unique**: Only one current (latest) rule per event name can exist
2. **Immutable Event Name**: Cannot change event name after creation
3. **Version Tracking**: Every edit creates a new version
4. **Status Preservation**: Editing preserves the active/inactive status
5. **Latest Only Editable**: Only the latest version can be edited or have its status changed
6. **Always Start Active**: New rules always start active

## Common Workflows

### Create and Activate
```
1. Add New Rule → Fill form → Create Rule
   Result: Rule created as version 1, active
```

### Update Business Logic
```
1. Select row → Edit → Change fields → Update Rule
   Result: New version created (e.g., v2), old version archived
```

### Temporarily Disable
```
1. Select row → Inactivate
   Result: Same version, now inactive (no new version)
```

### Re-enable
```
1. Select inactive row → Activate
   Result: Same version, now active again
```

### Update Inactive Rule
```
1. Select inactive row → Edit → Update Rule
   Result: New version created, remains inactive
2. Select new version → Activate
   Result: Now active with updated logic
```

## Tips

- ✅ Use **Active Only** filter for day-to-day operations
- ✅ Use **Show History** to audit changes over time
- ✅ Event names should follow a consistent naming convention
- ✅ Add meaningful tactic field names for better reporting
- ⚠️ Be careful with Delete - it removes all history
- 💡 Inactivate instead of delete if you might need the rule later

## Example: Full Lifecycle

```
Step 1: Create Rule
  - Event: dmu_impression
  - Version: 1, Active
  
Step 2: Edit (Change Billing Type)
  - Version: 2, Active (v1 archived)
  
Step 3: Inactivate (Campaign ended)
  - Version: 2, Inactive (no new version)
  
Step 4: Reactivate (Campaign resumed)
  - Version: 2, Active (no new version)
  
Step 5: Edit (Update Tactic Field)
  - Version: 3, Active (v2 archived)
  
History View Shows:
  - v3: Active, latest
  - v2: Inactive, historical
  - v1: Active, historical
```

## Troubleshooting

**Q: I can't select a row**
A: Make sure you're clicking the checkbox on the left side of the grid, not just clicking the row.

**Q: Edit button is disabled**
A: You can only edit the latest version. Check if the selected row shows "Historical" status.

**Q: Can't change event name**
A: Event names are immutable after creation. Create a new rule if you need a different event name.

**Q: New version is inactive after editing**
A: The edit preserved the status from the previous version. Click Activate to enable it.

**Q: Don't see any rules**
A: Check if "Active Only" is checked. Uncheck it or toggle "Show History" to see all rules.

