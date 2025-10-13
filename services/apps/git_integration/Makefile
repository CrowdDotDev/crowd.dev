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
	@if ! command -v uv >/dev/null 2>&1; then \
		echo "❌ uv not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@if ! uv run ruff --version >/dev/null 2>&1; then \
		echo "📦 Installing dev dependencies..."; \
		uv sync --group dev; \
	fi

##@ 🚀 Setup and installation

setup: ## Install uv and dev dependencies (only if not already installed)
	@echo "🔧 Checking if uv is installed..."
	@if command -v uv >/dev/null 2>&1; then \
		echo "✅ uv is already installed at $$(which uv)"; \
		echo "📦 Installing dev dependencies..."; \
		uv sync --group dev; \
		echo "✅ Setup complete"; \
	else \
		echo "📦 uv is required to:"; \
		echo "   - Add/remove packages to pyproject.toml"; \
		echo "   - Manage dependency versions and conflicts"; \
		echo "   - Generate uv.lock for reproducible builds"; \
		echo "   - Install dependencies locally for development"; \
		echo ""; \
		echo "Installing uv..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh; \
		echo "Adding uv to PATH..."; \
		echo 'export PATH="$$HOME/.cargo/bin:$$PATH"' >> ~/.zshrc; \
		echo 'export PATH="$$HOME/.cargo/bin:$$PATH"' >> ~/.bash_profile; \
		echo 'export PATH="$$HOME/.cargo/bin:$$PATH"' >> ~/.bashrc; \
		export PATH="$$HOME/.cargo/bin:$$PATH"; \
		echo "📦 Installing dev dependencies..."; \
		uv sync --group dev; \
		echo "✅ uv installed and dev dependencies ready"; \
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
	@uv run ruff check src/

format: check_setup ## Format code with ruff
	@uv run ruff check --fix --select I src/
	@uv run ruff format src/ 
	$(MAKE) lint

fix-all: check_setup ## Fix all lint issues, format everything, and run final lint check
	@echo "🔧 Fixing all linting issues..."
	@uv run ruff check --fix src/
	@echo "✨ Formatting all code..."
	@uv run ruff format src/
	@echo "🔍 Running final lint check..."
	@uv run ruff check src/
	@echo "✅ All done! Code is linted and formatted."

rebuild: ## Rebuild the container
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Container rebuilt"

##@ 📦 Dependency management

add_package: check_setup ## Add new package to pyproject.toml, example: make add_package name=requests
	@echo "Adding $(name) to dependencies..."
	@uv add $(name)
	@echo "Rebuilding container..."
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Package $(name) added and container rebuilt"

remove_package: check_setup ## Remove package from pyproject.toml, example: make remove_package name=requests
	@echo "Removing $(name) from dependencies..."
	@uv remove $(name)
	@echo "Rebuilding container..."
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Package $(name) removed and container rebuilt"

update_deps: check_setup ## Update all dependencies
	@echo "Updating dependencies..."
	@uv lock
	@echo "Rebuilding container..."
	$(COMPOSE_FILE) build git-integration-dev
	@echo "✅ Dependencies updated and container rebuilt"

lock_deps: check_setup ## Generate/update uv.lock file
	@echo "Generating uv.lock file..."
	@uv lock
	@echo "✅ uv.lock updated"

##@ 🧪 Testing

test: check_setup ## Run tests (test=file repo=name expected=file)
	@echo "🧪 Running tests..."
	@TEST_FILE="$(if $(test),src/test/$(test),src/test/)"; \
	if [ -n "$(repo)" ]; then \
		export TEST_REPO_NAME="$(repo)"; \
		echo "📁 Using repository: $(repo)"; \
	fi; \
	if [ -n "$(expected)" ]; then \
		export TEST_EXPECTED_FILE="$(expected)"; \
		echo "📄 Using expected output: $(expected)"; \
	fi; \
	uv run pytest $$TEST_FILE -v