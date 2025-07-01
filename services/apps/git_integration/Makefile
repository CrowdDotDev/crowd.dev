.DEFAULT_GOAL := help

help: ## Shows this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m  %s\033[0m\n\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

ifeq (cmd,$(firstword $(MAKECMDGOALS)))
  CMD_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  $(eval $(CMD_ARGS):;@:)
endif

COMPOSE_FILE = docker-compose -f ../../../scripts/services/git-integration.yaml

# Check if local setup is complete
check_setup:
	@if ! command -v poetry >/dev/null 2>&1; then \
		echo "❌ Poetry not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@if ! poetry run ruff --version >/dev/null 2>&1; then \
		echo "📦 Installing dev dependencies..."; \
		poetry install --with dev --no-interaction; \
	fi

##@ 🚀 Setup and installation

setup: ## Install Poetry and dev dependencies (only if not already installed)
	@echo "🔧 Checking if Poetry is installed..."
	@if command -v poetry >/dev/null 2>&1; then \
		echo "✅ Poetry is already installed at $$(which poetry)"; \
		echo "📦 Installing dev dependencies..."; \
		poetry install --with dev --no-interaction; \
		echo "✅ Setup complete"; \
	else \
		echo "📦 Poetry is required to:"; \
		echo "   - Add/remove packages to pyproject.toml"; \
		echo "   - Manage dependency versions and conflicts"; \
		echo "   - Generate poetry.lock for reproducible builds"; \
		echo "   - Install dependencies locally for development"; \
		echo ""; \
		echo "Installing Poetry..."; \
		curl -sSL https://install.python-poetry.org | python3 -; \
		echo "Adding Poetry to PATH..."; \
		echo 'export PATH="$$HOME/.local/bin:$$PATH"' >> ~/.zshrc; \
		echo 'export PATH="$$HOME/.local/bin:$$PATH"' >> ~/.bash_profile; \
		echo 'export PATH="$$HOME/.local/bin:$$PATH"' >> ~/.bashrc; \
		export PATH="$$HOME/.local/bin:$$PATH"; \
		echo "📦 Installing dev dependencies..."; \
		poetry install --with dev --no-interaction; \
		echo "✅ Poetry installed and dev dependencies ready"; \
		echo "📝 Next steps:"; \
		echo "   - Restart your terminal or run: source ~/.zshrc"; \
		echo "   - Use: make add_package name=<package> to add dependencies"; \
	fi

##@ 🛠️  Local development tools

run: ## Start the git-integration service in interactive mode
	$(COMPOSE_FILE) run --service-ports --rm git-integration-dev

cmd: ## Run any command inside the container, example: make cmd -- ls -la
	$(COMPOSE_FILE) run --rm --no-deps git-integration-dev $(CMD_ARGS)

lint: check_setup ## Check code with ruff
	@poetry run ruff check src/

format: check_setup ## Format code with ruff
	@poetry run ruff format src/

rebuild: ## Rebuild the container
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Container rebuilt"

##@ 📦 Dependency management

add_package: check_setup ## Add new package to pyproject.toml, example: make add_package name=requests
	@echo "Adding $(name) to dependencies..."
	@poetry add $(name)
	@echo "Rebuilding container..."
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Package $(name) added and container rebuilt"

remove_package: check_setup ## Remove package from pyproject.toml, example: make remove_package name=requests
	@echo "Removing $(name) from dependencies..."
	@poetry remove $(name)
	@echo "Rebuilding container..."
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Package $(name) removed and container rebuilt"

update_deps: check_setup ## Update all dependencies
	@echo "Updating dependencies..."
	@poetry update
	@echo "Rebuilding container..."
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Dependencies updated and container rebuilt"

lock_deps: check_setup ## Generate/update poetry.lock file
	@echo "Generating poetry.lock file..."
	@poetry lock
	@echo "✅ poetry.lock updated"