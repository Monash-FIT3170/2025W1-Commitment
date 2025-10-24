# **User Guide**

---

## **What is gitgauge?**

gitgauge is a desktop application for Teaching Assistants (TAs) to assess individual contributions in student group coding projects.
By analysing Git repository history, it provides:

- Clear contribution summaries
- Visual insights and timelines
- AI-generated commit analysis
- Ready-to-export grading sheets

All data stays on your machine. No setup headaches, no cloud sync.

---

## **Features**

- Import local or remote Git repositories (with optional PAT for private repos)
- View per-student contribution breakdowns with visual dashboards
- Use regex filters to refine commit analysis
- Upload a configuration file to map multiple contributor emails to one student
- Generate AI summaries using Gemini
- Export scaled grading data to CSV for upload to Monash Moodle

!!! note
    gitgauge is intended for Teaching Assistant (TA) use only.

---

## **Before You Start**

### **Generate an API Key (OPTIONAL)**

If you want AI-generated commit summaries:

1.	Visit: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) 
2.	Sign in with a Google account
3.	Click “Create API Key”
4.	Assign the key to a Cloud Project
5.	Copy the key and paste it into gitgauge when prompted

!!! note
    AI summaries are optional. gitgauge works fully without Gemini.

!!! warning
    Gemini API tokens are not stored and only used for the current session.

---

## **Example Scenario**

You are grading a group project for FIT3170. The group has pushed their work to a GitHub 
repository. You want to assess individual contributions.

Here’s the process:

1. Launch gitgauge.
2. Import the repository.
3. Upload a configuration file linking students to multiple emails.
4. Filter out unhelpful commits (e.g. formatting).
5. Review the AI summaries.
6. Upload the grading sheet.
7. Export the final scaled CSV.

---

## **Step By Step Workflow**

### **1. Launch gitgauge**

Start the app from your desktop.

---

### **2. Import a Repository**

- Enter a Git URL into the text box
- If importing a private repository, enter your Personal Access Token (PAT) when prompted

<p align="center">
  <img src="../../assets/screenshots/1a_import_public_repo.png" alt="Importing a public Git repository" width="700">
</p>
<p align="center"><em>Fig. 1a – Importing a public Git repository</em></p>


<p align="center">
  <img src="../../assets/screenshots/1b_import_private_repo.png" alt="Importing a private Git repository" width="700">
</p>
<p align="center"><em>Fig. 1b – Importing a private Git repository using PAT</em></p>



---

### **3. Link Disparate Emails to Contributor (OPTIONAL)**

Students often commit using different emails. To group them correctly:

- Click “Upload Config File”
- Upload a `.json` file mapping alternate emails to the student’s full name / identifier

<p align="center">
  <img src="../../assets/screenshots/2a_empty_config_modal.png" alt="Empty configuration modal before upload" width="600">
</p>
<p align="center"><em>Fig. 2a – Empty configuration modal</em></p>


<p align="center">
  <img src="../../assets/screenshots/2b_active_config_modal.png" alt="Active configuration modal showing mapped contributors" width="600">
</p>
<p align="center"><em>Fig. 2b – Configuration with mapped contributors</em></p>


!!! warning
    Only contributors listed in the config file will be included in the analysis and export.
    Unmapped commit emails are ignored entirely.

TEMPLATE AVAILABLE: See [Example Config](../../assets/templates/example-config.csv) in the repo.

---

### **4. Explore the Visual Dashboard**

- See visualisations of contributions:
    - Commit timelines
    - Code churn over time
    - Metric-based breakdowns
    - Apply regex filters to ignore noise (e.g. “typo”, “test commit”)

<p align="center">
  <img src="../../assets/screenshots/3a_empty_regexx_modal.png" alt="Empty regex filter modal" width="600">
</p>
<p align="center"><em>Fig. 3a – Add regex filter to refine analysis</em></p>


<p align="center">
  <img src="../../assets/screenshots/3b_active_regex_modal.png" alt="Active regex modal with applied filters" width="600">
</p>
<p align="center"><em>Fig. 3b – Example regex filter: exclude 'fix', 'format'</em></p>


<p align="center">
  <img src="../../assets/screenshots/3c_active_regex_cont_cards.png" alt="Regex modal showing filtered commit cards" width="600">
</p>
<p align="center"><em>Fig. 3c – Filtered view with irrelevant commits removed</em></p>


!!! tip
    Try `*/merge: PR#.*` to exclude merge commits as a test.

---

### **5. Review Contributor Overview**

-  View:
    - Total commits
    - Lines of code added/removed
    - Contribution weighting by metric

<p align="center">
  <img src="../../assets/screenshots/4a_cont_overview.png" alt="Per-contributor breakdown view" width="700">
</p>
<p align="center"><em>Fig. 4a – Overview of all contributors</em></p>


<p align="center">
  <img src="../../assets/screenshots/4b_cont_card.png" alt="Specific contributor card view" width="600">
</p>
<p align="center"><em>Fig. 4b – Individual contributor performance</em></p>



---

### **6. View AI Generated Analysis**
- Open the “AI Analysis” tab
- Review summaries of:
    - Commit patterns
    - Effort distribution
    - Highlights or red flags

<p align="center">
  <img src="../../assets/screenshots/5a_enter_API_key.png" alt="Sidebar view showing text area to enter API key" width="400">
</p>
<p align="center"><em>Fig. 5a – Enter Gemini API key</em></p>


<p align="center">
  <img src="../../assets/screenshots/5b_progress_AI_summary_generation.png" alt="Progress screen showing status of number of AI summaries generated" width="700">
</p>
<p align="center"><em>Fig. 5b – Generating AI summaries</em></p>


<p align="center">
  <img src="../../assets/screenshots/5c_completed_AI_summary_generation.png" alt="AI summary view showing Gemini-powered analysis" width="700">
</p>
<p align="center"><em>Fig. 5c – Completed AI Summary per contributor</em></p>



---

### **7. Upload Grading Sheet and Export**

- Upload a CSV with student emails
- gitgauge matches contributors to the grading sheet
- Export final results as a CSV file

<p align="center">
  <img src="../../assets/screenshots/6a_empty_grading_modal.png" alt="Uploading a CSV grading sheet modal" width="600">
</p>
<p align="center"><em>Fig. 6a – Upload grading sheet</em></p>


<p align="center">
  <img src="../../assets/screenshots/6b_active_grading_modal.png" alt="Uploading a CSV grading sheet modal" width="600">
</p>
<p align="center"><em>Fig. 6b – Review mapped grading</em></p>


<p align="center">
  <img src="../../assets/screenshots/6c_output_grading_modal.png" alt="Exporting a scaled CSV grading sheet modal" width="600">
</p>
<p align="center"><em>Fig. 6c – Export results</em></p>

---

## **Contributor Configuration File**

Use a `.json` file to group all known emails under a single student identity.

### **Example Config Format**

```
{
  "Student Full Name 1": [
    "student1@university.edu",
    "alt1@gmail.com",
    "alt2@users.noreply.github.com"
  ],
  "Student Full Name 2": [
    "student2@university.edu"
  ]

}
```

!!! warning
    - Only mapped contributors are included in contribution analysis
    - Emails not in the configuration will not be shown or included in stats
    - Unlinked commits are silently ignored

### **How To Obtain Contributor Emails**

#### **OPTION 1: Ask Students to Submit All Potential Contributing Emails**

```

git config user.email

```

#### **OPTION 2: Extract From Git Log**

```

git log --format='%ae' | sort | uniq

```


---

## **Handling Missing Contributor Cases**

| **Contributor in Repository** | **Contributor in Grading Sheet** | **Contributor in Config File** | **Outcome** |
|---------------|------------------|----------------|----------|
| {{ check_icon() }} | {{ check_icon() }} | {{ check_icon() }} | Student receives a scaled grade based on their contributions using the selected metric and branch. |
| {{ cross_icon() }} | {{ check_icon() }} | {{ check_icon() }} | Student appears in the grading sheet but has made no commits. They receive **"NA"** in the scaled mark output. |
| {{ check_icon() }} | {{ cross_icon() }} | {{ check_icon() }} | Contributor is not listed in the grading sheet and is assumed to be outside the analysed cohort. Their data is **ignored** in the export. |
| {{ check_icon() }} | {{ check_icon() }} | {{ cross_icon() }} | Contributor’s commits are found, but their email is not mapped in the configuration file. These commits are **ignored** and not shown as separate contributors. |

---

## **Privacy and Security**

- gitgauge runs 100% locally
- No data is uploaded or synced
- Repositories are auto-deleted after 30 days
- PATs and Gemini tokens are never stored

!!! reminder
    Always obtain student consent before analysis.

---

## **Troubleshooting & FAQ**

**Q: The AI summary isn’t loading**
> A: Check your Gemini API key and verify your usage quota.

**Q: A contributor shows up twice**
> A: Use the configuration file to group all their email addresses.

**Q: A student isn’t appearing in the outputted grading sheet**
> A: Their email may be missing from the configuration file or inputted grading CSV.
