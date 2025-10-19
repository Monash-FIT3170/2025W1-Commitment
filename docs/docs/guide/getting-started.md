# **User Guide**

## **What is gitgauge?**

gitgauge is a desktop tool that helps Teaching Assistants (TAs) assess student group contributions in Git-based projects. It analyses repository activity to provide visual summaries, AI-generated insights, and grading exports, making group assessment more transparent and manageable.

---

## **Before You Start**

### **Generate a Gemini API Key (for AI summaries)**

gitgauge uses Google Gemini to generate commit insights. You will need an API key to enable this feature.

**Steps:**

1. Visit: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)  
2. Sign in with a Google account.  
3. Click "Create API Key"  
4. Name your key  
5. Attach your key to a Cloud Project  
6. Copy and paste the key into the application when prompted.

> Note: Gemini summaries are optional, gitgauge will still function without AI insights.

---

## **Step-by-Step Workflow**

### **1\. Launch gitgauge**

Open the gitgauge application from your desktop.

### **2\. Import a Repository**

- Click "Import Repository"  
- Paste the HTTPS Git URL or choose a local folder.  
- For private repos, enter your Personal Access Token (PAT) when prompted.

\img of homepage 
\img of PAT screen

---

### **3\. Link Contributor Emails (Optional)**

Students may have committed using multiple email addresses. To group these under one name:

- Click "Upload Config File"  
- Upload a `.json` file mapping alternate emails to the main student email (see format below)

This ensures accurate grouping in the dashboard and grading report.

\img of empy config modal 
\img of uploaded config modal

---

### **4\. Explore the Visual Dashboard**

- View commit timelines, activity graphs, and contribution summaries.  
- Use filters (e.g., regex to exclude "typo", "test", etc.) to refine the data.

\img of regex modal 
\img of active regex modal

---

### **5\. Review Contributor Overview**

See each student’s:  

- Total commits  
- Lines added/deleted  
- Contribution weighting based on your selected metric

\img of overview page with card highlightedz and icon highlighted

---

### **6\. View AI-Generated Analysis**

- Toggle the "AI Analysis" tab to see summaries of each student’s contribution patterns, effort, and anomalies.  
- Helps identify under-contributors, red flags, or standout efforts.

AI tokens are never stored and used only for session-based summaries.

\img of AI summary screen 
\img of AI loading screen 
\img of finished AI summary screen

---

### **7\. Import Grading Sheet & Export**

- Upload a CSV containing student names/emails.  
- gitgauge maps found contributors to this list.  
- Export your grading summary (CSV format) for upload to Moodle or your LMS.

\img of inputted grading sheet 
\img of upload grading sheet modal 
\img of downloaded grading sheet modal 
\img of outputted grading sheet

### **What happens if an email is missing from the grading sheet?**

If an email in the grading CSV is not found in the Git history or config file, gitgauge will:  

- Flag it as "missing" in the results  
- Leave that contributor's row empty in the export  
- Still include other matched students normally

It's strongly recommended to review and update the config file before final grading export.

---

## **Contributor Config File**

To group multiple commit emails under one student identity, create a `.json` config file with the following format:

```
{
    "student1@university.edu": [
        "alt1@gmail.com", 
        "alt2@users.noreply.github.com"
    ],

    "student2@university.edu": ["another.email@example.com"]
}
```

### **What happens if an email is missing from the config file?**

If a contributor’s email address is not found in the config file, gitgauge will:

- Not include those contributions in any statistics for any other contributor  
- Not include those contributions as an additional person  
- Contributions under the unlinked email address are discarded

It is the responsibility of the students providing their information to make sure potential contributing email addresses are all accounted for.

---

## **Privacy and Security**

- gitgauge runs entirely on your local machine  
- No data is uploaded, shared, or stored externally  
- Cloned repositories are automatically deleted after 30 days  
- PATs and Gemini tokens are not stored, they are used only for the active session

Always obtain student consent before analysing their contributions.

---

## **Troubleshooting & FAQ**

**Q: The AI summary isn’t loading.**  
A: Check that your Gemini API key is valid and hasn’t exceeded quota.

**Q: A contributor shows up as multiple people.**  
A: Use the config file to map all alternate emails to the main student email.

**Q: A student in my grading sheet isn’t showing up.**  
A: They may not have committed to the repo or their email isn’t included in the config file.