# Codename Challenge

A web application for managing teams and scores for the Codename board game.

## Features

- Create and manage teams
- Track game scores
- Responsive design for desktop and mobile
- Local storage for game persistence

## Technology

This project is built using:
- TypeScript
- Webpack
- HTML5
- CSS3

## Getting Started

To run this project locally:

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Open your browser to `http://localhost:8080`

## Development Workflow

### Making Changes and Testing Locally

1. Make your code changes in the `src` directory
2. Run `npm start` to start the development server with hot-reloading
3. View your changes at `http://localhost:9000` (changes will update automatically)
4. Once you're satisfied, commit your changes to your feature branch

### Testing Production Build Locally

To test the production build (with GitHub Pages path configuration):

1. Run `npm run build:gh-pages` to create a production build with GitHub Pages settings
2. The compiled files will be in the `dist` directory
3. You can serve these files locally using a simple HTTP server to verify they work correctly

## Deployment

This application can be deployed in two different ways: automatically via GitHub Actions or manually using the gh-pages npm package. Both methods use the same build script but differ in how the deployment is handled.

### Automatic Deployment with GitHub Actions

This application is deployed using GitHub Pages and can be accessed at:
[https://lsigism.github.io/codename-challenge/](https://lsigism.github.io/codename-challenge/)

Deployment happens automatically when changes are pushed to the `main` branch. Behind the scenes:

1. The GitHub Actions workflow in `.github/workflows/deploy.yml` is triggered
2. The workflow:
   - Checks out your code from the repository
   - Sets up Node.js with the required version
   - Installs dependencies using `npm ci`
   - Builds the application using `npm run build:gh-pages`
   - Configures the GitHub Pages environment
   - Uploads the `dist` directory as a deployment artifact
   - Deploys the artifact to GitHub Pages using GitHub's official deploy-pages action
3. The deployment is published to the same URL as the manual deployment

This automatic process ensures your site is rebuilt and deployed whenever you push changes to the `main` branch, without requiring any manual steps.

You can view the complete workflow configuration in `.github/workflows/deploy.yml`.

### Manual Deployment with gh-pages package

For quick testing or when automatic deployment isn't suitable, you can manually deploy:

1. Run `npm run deploy`
2. Behind the scenes, this command:
   - First runs the `predeploy` script automatically (due to npm's script hooks)
   - The `predeploy` script executes `npm run build:gh-pages` to build your application
   - The build process creates the production files in the `dist` directory
   - Then the `gh-pages` package takes the contents of the `dist` folder
   - It commits these files to the `gh-pages` branch
   - Finally, it pushes this branch to GitHub
3. GitHub Pages will serve the content from this branch at: [https://lsigism.github.io/codename-challenge/](https://lsigism.github.io/codename-challenge/)

**Note:** Both deployment methods use the same `build:gh-pages` script to create the production bundle, but they differ in how the deployment is handled.

## GitHub Pages Configuration

### About the gh-pages Branch

The `gh-pages` branch is a special branch used by GitHub Pages for deployment. Here's what you should know:

- It's a separate branch that only contains the built/compiled files of your application
- It's created and managed automatically by the `gh-pages` npm package when you run `npm run deploy`
- You should never need to commit to this branch directly
- The branch name is standard for GitHub Pages deployments using the gh-pages package

### Changing the Deployment Branch

If you need to use a different branch for GitHub Pages deployment:

1. In your GitHub repository settings, you can configure GitHub Pages to use a different branch
2. To change the branch used by the `gh-pages` package, modify the `deploy` script in `package.json`:

   ```json
   "deploy": "gh-pages -b custom-branch-name -d dist"
   ```

3. Alternatively, to use the GitHub Actions workflow with a different branch, modify the `deploy.yml` file in the `.github/workflows` directory
