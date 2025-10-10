

# **User Guide**

## **Introduction**

gitgauge is a desktop application that helps Teaching Assistants (TAs) fairly and efficiently assess how much each student has contributed to a group coding project.

By analysing a local or remote Git repository, gitgauge provides clear visual insights into who contributed, how much they contributed, and when.  
This enables more objective grading through holistic analysis and easily recognisable contribution patterns.

---

## **Install Guide**

1. Install gitgauge from [Downloads](../index.md#downloads).
2. Open the app and select your repository path.
3. Choose branches and date range to analyse.
4. Have fun!

---

## **Features**

### **Repository Import**

- Select any Git repository to begin analysis.  
- For private repositories, input a Personal Access Token (PAT) to authenticate.  
- gitgauge automatically scans the project’s commit history, branches, and file changes.

---

### **Visual Analytics Dashboard**

- Displays intuitive graphs showing how contributions are distributed among group members.

- Helps you quickly identify:

    - Uneven workloads  
    - Inactive or less active contributors  
    - High-performing contributors

- Apply custom filters to exclude specific types of commits (for example, minor fixes or formatting) using regular expressions (regex).

- Supports grouping of multiple Git accounts under a single student by uploading a configuration file.

    - Each alternate email must be explicitly linked to the student’s main email for accurate analysis.

**Available Analysis Metrics:**

- Total number of commits (default)  
- Commit size (lines added or removed)  
- Absolute difference per commit

---

### **Contributor Overview**

- View a comprehensive summary of each contributor’s activity:

    - Name and contribution statistics  
    - Total commits made  
    - Lines of code added and deleted  
    - Scaled weighting according to the selected metric

- Includes AI-generated analysis to highlight contribution patterns and potential anomalies.

---

### **Artificial Intelligence (AI) Analysis**

- Automatically generates insights and summaries for each contributor’s commit history.  
- Highlights key contribution trends, outliers, and areas that may warrant closer review.  
- Designed to support holistic, well-rounded evaluation of individual performance within a group project.

---

### **Report Exporting**

- Import a CSV grading sheet containing contributor names for analysis.  
- gitgauge automatically matches contributors found in the repository and scales their metrics accordingly.  
- Export your grading results as a CSV file for seamless upload to Moodle or other grading systems.

---

## **How to Use**

1. Launch gitgauge from your desktop.  
2. Enter the HTTPS link of the repository you wish to analyse.  
3. Select the branch and metric for analysis.  
4. (Optional) Link different contributor email addresses to a single contributor.  
5. (Optional) Exclude specific commits using a regex filter.  
6. Explore contribution data through the Visual Dashboard.  
7. Upload your CSV grading sheet with contributor details.  
8. Export the completed grading report as needed.

---

## **Privacy and Security**

Before using gitgauge, Teaching Assistants must obtain student consent to analyse their repository contributions.

gitgauge runs entirely on your local machine. It does not upload, share, or store any data externally.

- All cloned repositories are automatically deleted after 30 days.  
- Personal Access Tokens (PATs) are required for actions such as cloning and syncing private repositories.  
- gitgauge does not store any PATs or Gemini API tokens, they are used only during the current session and never saved to disk.

This ensures that all analysis remains secure, private, and fully under your control.
