# Database Migrations

This directory contains database migration scripts for the Next Gig backend.

## Available Migrations

### 1. Add Email Notifications Field

**File**: `add_email_notifications_field.py`

**Purpose**: Adds `emailNotificationsEnabled: true` to all existing users

**When to Run**: Before deploying the unsubscribe feature to production

**Command**:
```bash
cd /Users/JackRobertson/Next-Gig-Prod/backend
python migrations/add_email_notifications_field.py
```

**What It Does**:
- Scans all users in Firestore `users` collection
- Adds `emailNotificationsEnabled: true` to users without the field
- Skips users who already have the field
- Shows progress and summary
- Verifies all users have the field after migration

**Safe to Run Multiple Times**: ✅ Yes (idempotent)

---

## Running Migrations

### Prerequisites

1. **Environment Variables**:
   - Ensure `.env` file has `FIREBASE_CREDENTIALS_PATH` set
   - Firebase credentials JSON file must exist

2. **Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Steps

1. **Navigate to backend directory**:
   ```bash
   cd /Users/JackRobertson/Next-Gig-Prod/backend
   ```

2. **Run migration script**:
   ```bash
   python migrations/add_email_notifications_field.py
   ```

3. **Review output**:
   - Check for any errors (❌)
   - Verify migration summary
   - Ensure verification passes

### Example Output

```
🚀 Starting database migration: Adding emailNotificationsEnabled field

✅ Updated user1@example.com - emailNotificationsEnabled set to true
✅ Updated user2@example.com - emailNotificationsEnabled set to true
⏭️  Skipping user3@example.com - field already exists (value: True)

============================================================
📊 Migration Summary
============================================================
Total Users Processed:     10
✅ Users Updated:          7
⏭️  Users Skipped:          3 (already had field)
❌ Errors:                 0
============================================================

🎉 Migration completed successfully!

🔍 Verifying migration...

============================================================
🔍 Verification Results
============================================================
Total Users:                10
✅ Users WITH field:        10
❌ Users WITHOUT field:     0
============================================================

✅ All users have emailNotificationsEnabled field!
```

---

## Best Practices

1. **Backup First**: Consider exporting Firestore data before running migrations
2. **Test Locally**: Run against development database first
3. **Review Logs**: Check output for errors or unexpected behavior
4. **Verify**: Script includes automatic verification step
5. **Safe to Re-run**: All migrations are idempotent

---

## Troubleshooting

### Error: "Missing FIREBASE_CREDENTIALS_PATH"
- Check that `.env` file exists in `/backend` directory
- Verify `FIREBASE_CREDENTIALS_PATH` is set correctly
- Ensure Firebase credentials JSON file exists at specified path

### Error: "Module not found"
- Run `pip install -r requirements.txt` from backend directory
- Ensure you're in the correct directory when running script

### Some users not updated
- Check error logs for specific user IDs
- Verify Firestore permissions
- Re-run script (safe to run multiple times)

---

## Creating New Migrations

When creating new migration scripts:

1. **Use descriptive filenames**: `add_[field_name]_field.py`
2. **Include docstrings**: Explain what the migration does
3. **Make it idempotent**: Safe to run multiple times
4. **Add verification**: Include a verification step
5. **Show progress**: Use emoji indicators for clarity
6. **Document here**: Add to this README

---

**Last Updated**: 2025-01-22
