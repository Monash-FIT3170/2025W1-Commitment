// Types
export type Branch = Readonly<{
  commits: Commit[],
  dateRange: string
}>

export type File = Readonly<{
  status: string,
  added: number,
  deleted: number,
  changed: number,
  path: string
}>

export type Commit = Readonly<{
  date: string,
  time: string,
  branch: string,
  filesChanged: File[]
}>

export type User = Readonly<{
  username: string,
  image: string,
  userEmails: string[],
  commits: Commit[]
}>;

// Dummy Data array - of users
export const users: User[] = [
    {
        username: "Harshath",
        image: 'https://github.com/identicons/Hersheys2604.png',
        userEmails: ["harshath@example.com"],
        commits: [
          {
            date: "2025-05-01",
            time: "01:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 10, deleted: 2, changed: 12, path: "src/auth.ts" }
            ]
          },
          {
            date: "2025-05-01",
            time: "01:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 10, deleted: 2, changed: 12, path: "src/auth.ts" }
            ]
          },
          {
            date: "2025-05-01",
            time: "01:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 10, deleted: 2, changed: 12, path: "src/auth.ts" }
            ]
          },
          {
            date: "2025-05-02",
            time: "02:00 PM",
            branch: "feature/login",
            filesChanged: [
              { status: "added", added: 50, deleted: 0, changed: 50, path: "src/components/LoginForm.tsx" }
            ]
          },
          {
            date: "2025-05-03",
            time: "03:00 AM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "deleted", added: 0, deleted: 30, changed: 30, path: "src/legacy.ts" }
            ]
          },
          {
            date: "2025-05-04",
            time: "04:00 PM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "modified", added: 5, deleted: 3, changed: 8, path: "src/dashboard.tsx" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
            ]
          },
          {
            date: "2025-05-06",
            time: "06:00 PM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "modified", added: 2, deleted: 1, changed: 3, path: "src/auth.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 PM",
            branch: "hotfix/profile-404",
            filesChanged: [
              { status: "modified", added: 2, deleted: 2, changed: 4, path: "src/profile.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/server-crash",
            filesChanged: [
              { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
            ]
          }
        ]
      },
      {
        username: "Audrey",
        image: 'https://github.com/identicons/audreypho.png',
        userEmails: ["audrey@example.com"],
        commits: [
          {
            date: "2025-05-01",
            time: "01:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "added", added: 40, deleted: 0, changed: 40, path: "src/notifications.ts" }
            ]
          },
          {
            date: "2025-05-02",
            time: "02:00 PM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 12, deleted: 4, changed: 16, path: "src/notifications.ts" }
            ]
          },
          {
            date: "2025-05-01",
            time: "01:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 10, deleted: 2, changed: 12, path: "src/auth.ts" }
            ]
          },
          {
            date: "2025-05-03",
            time: "03:00 AM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "added", added: 30, deleted: 0, changed: 30, path: "src/settings.ts" }
            ]
          },
          {
            date: "2025-05-03",
            time: "03:00 AM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "deleted", added: 0, deleted: 30, changed: 30, path: "src/legacy.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "deleted", added: 0, deleted: 15, changed: 15, path: "src/email.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/server-crash",
            filesChanged: [
              { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
            ]
          }
        ]
      },
      {
        username: "Yali",
        image: 'https://github.com/identicons/JohnYaliLin.png',
        userEmails: ["yali@example.com"],
        commits: [
          {
            date: "2025-05-01",
            time: "01:00 PM",
            branch: "feature/login",
            filesChanged: [
              { status: "added", added: 25, deleted: 0, changed: 25, path: "src/profile.ts" }
            ]
          },
          {
            date: "2025-05-02",
            time: "02:00 PM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 10, deleted: 5, changed: 15, path: "src/profile.ts" }
            ]
          },
          {
            date: "2025-05-03",
            time: "03:00 PM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "added", added: 18, deleted: 0, changed: 18, path: "src/preferences.ts" }
            ]
          },
          {
            date: "2025-05-03",
            time: "03:00 AM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "deleted", added: 0, deleted: 30, changed: 30, path: "src/legacy.ts" }
            ]
          },
          {
            date: "2025-05-06",
            time: "02:00 PM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "modified", added: 4, deleted: 0, changed: 4, path: "src/security.ts" }
            ]
          },
          {
            date: "2025-05-06",
            time: "02:00 PM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "modified", added: 4, deleted: 0, changed: 4, path: "src/security.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/server-crash",
            filesChanged: [
              { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
            ]
          }
        ]
      },
      {
        username: "Tyler",
        image: 'https://github.com/identicons/oraqlle.png',
        userEmails: ["tyler@example.com"],
        commits: [
          {
            date: "2025-05-01",
            time: "10:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "added", added: 100, deleted: 0, changed: 100, path: "src/chat.ts" }
            ]
          },
          {
            date: "2025-05-02",
            time: "11:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 15, deleted: 5, changed: 20, path: "src/chat.ts" }
            ]
          },
          {
            date: "2025-05-03",
            time: "12:00 PM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "added", added: 60, deleted: 0, changed: 60, path: "src/components/ChatUI.tsx" }
            ]
          },
          {
            date: "2025-05-04",
            time: "01:00 PM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "modified", added: 5, deleted: 3, changed: 8, path: "src/components/ChatUI.tsx" }
            ]
          },
          {
            date: "2025-05-05",
            time: "02:00 PM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "modified", added: 2, deleted: 1, changed: 3, path: "src/chat.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/server-crash",
            filesChanged: [
              { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
            ]
          }
        ]
      },
      {
        username: "Darcy",
        image: 'https://github.com/identicons/dBystersky.png',
        userEmails: ["darcy@example.com"],
        commits: [
          {
            date: "2025-05-01",
            time: "09:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "added", added: 80, deleted: 0, changed: 80, path: "src/security.ts" }
            ]
          },
          {
            date: "2025-05-02",
            time: "10:00 AM",
            branch: "feature/login",
            filesChanged: [
              { status: "modified", added: 8, deleted: 2, changed: 10, path: "src/security.ts" }
            ]
          },
          {
            date: "2025-05-03",
            time: "11:00 AM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "added", added: 35, deleted: 0, changed: 35, path: "src/encryption.ts" }
            ]
          },
          {
            date: "2025-05-04",
            time: "12:00 PM",
            branch: "feature/dashboard",
            filesChanged: [
              { status: "modified", added: 10, deleted: 1, changed: 11, path: "src/encryption.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "01:00 PM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "deleted", added: 0, deleted: 5, changed: 5, path: "src/legacySecurity.ts" }
            ]
          },
          {
            date: "2025-05-06",
            time: "02:00 PM",
            branch: "hotfix/login-crash",
            filesChanged: [
              { status: "modified", added: 4, deleted: 0, changed: 4, path: "src/security.ts" }
            ]
          },
          {
            date: "2025-05-05",
            time: "05:00 AM",
            branch: "hotfix/server-crash",
            filesChanged: [
              { status: "added", added: 20, deleted: 0, changed: 20, path: "src/utils/errorHandler.ts" }
            ]
          }
        ]
      }
    ];
