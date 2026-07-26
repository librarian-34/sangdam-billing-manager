// ════════════════════════════
//  Constants
// ════════════════════════════
const CLIENT_ID =
  "542157178760-ffrig2tp7briqvaora0fqsco54pmfenb.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar";
const STORAGE_KEY = "billing_db";
const DATA_VERSION = 2;
const MIGRATION_BACKUP_STORAGE_KEY = "billing_db_migration_backups";
const PAUSE_REMINDER_DISMISS_STORAGE_KEY = "billing_pause_reminder_dismissals";
const PAUSE_REMINDER_WINDOW_DAYS = 5;

const CLIENT_GROUP_OPTIONS = [
  {
    value: "PERSONAL",
    label: "개인내담자",
    clientType: "PERSONAL",
    billingType: "DIRECT",
  },
  {
    value: "ORG_SIMSIM",
    label: "기관내담자 - 심심",
    clientType: "ORGANIZATION",
    billingType: "EXTERNAL",
  },
  {
    value: "ORG_SEJONGRO",
    label: "기관내담자 - 세종로",
    clientType: "ORGANIZATION",
    billingType: "EXTERNAL",
  },
];

const CLIENT_GROUP_LABELS = Object.fromEntries(
  CLIENT_GROUP_OPTIONS.map((option) => [option.value, option.label]),
);

const _now = new Date();
const YEAR = _now.getFullYear();
const MONTH = _now.getMonth() + 1;
const DAY = _now.getDate();
