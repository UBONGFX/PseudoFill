# PseudoFill

PseudoFill is a privacy-first browser extension that helps users fill web forms with site-specific pseudonyms and aliases. It follows GDPR principles such as data minimization, local-only storage, and no tracking, and is designed for privacy-conscious users.

⚠️ **Important:**  
PseudoFill is a **nice-to-have privacy enhancement**, not a complete privacy solution.  
It is designed to **complement**, not replace, core privacy best practices.

---

## ✨ Key Features

- 🔐 **Site-specific pseudonyms**
  - Generates a consistent pseudonym per website/domain
  - Avoids reusing the same name across different services

- 📧 **Alias-friendly email handling**
  - Works well with email alias providers (e.g. plus-addressing or alias services)
  - No email forwarding or mail handling inside the extension

- 🧠 **Local-only storage**
  - All data is stored locally using the browser extension storage
  - No cloud sync, no remote API calls

- 📝 **Manual form filling**
  - Forms are filled only on explicit user action
  - No background scraping or automatic submission

- 🧩 **Minimal permissions**
  - Uses only the permissions required to function
  - No access beyond the active tab unless explicitly configured

---

## 🚫 What PseudoFill Is NOT

PseudoFill is **not** intended to:

- create or impersonate real people
- bypass identity verification, age checks, or legal requirements
- generate realistic fake identities (addresses, government IDs, dates of birth, etc.)
- automate mass registrations or abuse online services

The project intentionally avoids features that could facilitate deception or misuse.

---

## 🛠️ Development

### Dev Container

This project includes a **Dev Container** configuration for easy setup. If you're using Visual Studio Code with the Dev Containers extension or GitHub Codespaces, you can open the project in a containerized environment with all dependencies pre-configured.

To use the Dev Container:
1. Install [Docker](https://www.docker.com/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
2. Open the project in VS Code
3. Click "Reopen in Container" when prompted, or run the command: **Dev Containers: Reopen in Container**

The container automatically installs Node.js, pnpm, and all project dependencies.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---
