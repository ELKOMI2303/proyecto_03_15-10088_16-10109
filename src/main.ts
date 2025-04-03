// main.ts
document.addEventListener("DOMContentLoaded", () => {
    const mainMenu = document.getElementById("main-menu") as HTMLElement;
    const controlsPanel = document.getElementById("controls-panel") as HTMLElement;
    const currentSelection = document.getElementById("current-selection") as HTMLElement;
    const backButton = document.getElementById("back-btn") as HTMLButtonElement;
    let currentApp: any = null;
  
    // Ocultar controles al inicio
    controlsPanel.style.display = "none";
  
    document.querySelectorAll(".start-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const option = target.getAttribute("data-option");
            
            // Ocultar menú principal completamente
            mainMenu.style.display = "none";
            // Mostrar controles
            controlsPanel.style.display = "block";
            currentSelection.textContent = target.textContent;
  
            if (option) {
                loadApp(option);
            } else {
                console.error("Option is null");
            }
        });
    });
  
    backButton.addEventListener("click", () => {
        // Mostrar menú principal
        mainMenu.style.display = "block";
        // Ocultar controles
        controlsPanel.style.display = "none";
        
       // Destruir instancia de la app y limpiar
        if (currentApp) {
            currentApp.destroy(); // Asegúrate de tener este método en tu clase App
            const container = document.getElementById("app-container");
            container?.remove();
            currentApp = null;
        }
    
        // Limpiar selección actual
        currentSelection.textContent = "";
    });
  
    function loadApp(_option: string) {
        const container = document.getElementById("app-container") || document.createElement("div");
        container.id = "app-container";
        if (!document.body.contains(container)) {
            document.body.appendChild(container);
        }
        
        import("./app").then(module => {
            currentApp = new module.NightVision();
            currentApp.init();
        });
    }
  
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            backButton.click();
        }
    });
});
