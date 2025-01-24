# OSSPEX Dashboard

The **Open Source Sustainability Explorer (OSSPEX)** dashboard is a Vue.js-based application that provides visual insights into open-source projects, offering metrics and recommendations to improve project health. This guide will help you set up and use the dashboard effectively.

## Key Functionalities

- **Project Information**: Explore detailed metrics for open-source projects from the Apache and Eclipse Foundations, for instance, project description, social networks, technical networks, and github repositories to name a few.
- **Project Health Metric**: The graduation forecast for each project gives you an insight of how the project is performing over that month, or a selected range of months. (The values range from 0 to 1) 
- [Coming Soon] **Recommendations**: The dashboard will provide actionable steps to address performance issues. For instance, if a project's score is below 0.5 for a specific month, it will analyze historical data and suggest targeted improvements to help the project achieve or surpass the 0.5 threshold.
- **Interactive UI**: Leverage interactive elements, including filters and drill-down views, to refine and explore data. Feel free to select any project from the foundations and select a month, the data would be populated, and the advanced analytics provide the social and technical network values for that project and month (if available).

## How to Use OSSPEX

1. **Select a Technology and Project**:
   - Use the input drop-down menu to choose a desired technology.
   - Search for a specific project and repository within the technology.
   - Once that's selected, drag the month selector to a specific month whose data you want to visualize

2. **Visualize Metrics**:
   - Once a project is selected, you can view the **Graduation Forecast**, **Project Description**, **Status of the Project** and other statistics.
   - To access the **Social Network for Issues/Emails** and **Technical Network for Commits**, ensure that a repository is selected. This is visible when you click on the 'See Advanced Analytics' option located at the bottom of the page

3. **Visual Details**:
   - **Graduation Forecast**:
     - Displays a forecast value for each project time period.
     - Another tab shows a more refined view, i.e. 3 months for that project
   - **Social Network: Emails**: 
     - Visualizes email exchanges between developers for the selected project and time period.
     - Shows sender and replier nodes, developer names, and interaction percentages.
   - **Social Network: Issues**:
     - Illustrates issue-comment exchanges between developers for the selected repository and month.
   - **Technical Network**:
     - Similar to the social network but focused on developers and files they committed to.

4. **Statistics and Adjustments**:
   - Below the social and technical network visuals, find monthly stats, like the number of email exchanges, number of commits, etc.
   - Resize windows and adjust network visuals for a better understanding of the data.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)

## Type Support for `.vue` Imports in TypeScript

TypeScript shims `.vue` imports to a generic Vue component type. For enhanced prop type validation, use `Volar: Switch TS Plugin on/off` from the VS Code command palette.

## Project Setup

1. **Ensure Node.js Version**: Make sure Node.js version 14.x or above is installed.
2. Clone the repository:

   ```sh
   git clone https://github.com/priyalsoni15/OSS-Project-Explorer.git
   cd OSS-Project-Explorer
   ```

3. **Install Dependencies**:

   ```sh
   npm install
   ```

### Compile and Hot-Reload for Development

To start the development server:

```sh
npm run dev
```

### Type-Check, Compile, and Minify for Production

```sh
npm run build
```

### Clear Cache and Reinstall Dependencies (if issues arise)

If the project fails to build locally, clear the cache and retry:

```sh
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Contributing
Contributions are welcome! However, do ensure that you are not committing directly to this repo. Do feel free to fork this though, and open a Pull Request for a minor fix or otherwise. For major changes, please open an issue first to discuss what you'd like to change. And we can work on integrating it!

### Contact
In case of any questions, feel free to reach out to priyal15.soni@gmail.com or pdsoni@ucdavis.edu.

### License
This project is licensed under the Apache License 2.0.
