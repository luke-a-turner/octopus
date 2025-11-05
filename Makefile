.PHONY: help install install-backend install-frontend dev test lint format clean all

# Default target
.DEFAULT_GOAL := help

# Color output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)Octopus Energy Dashboard - Makefile Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation

install: install-backend install-frontend ## Install all dependencies (backend + frontend)
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

install-backend: ## Install backend dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	poetry install
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"

install-frontend: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

##@ Development

dev-backend: ## Run backend development server
	@echo "$(BLUE)Starting backend server...$(NC)"
	poetry run uvicorn api.api:app --reload

dev-frontend: ## Run frontend development server
	@echo "$(BLUE)Starting frontend server...$(NC)"
	cd frontend && npm run dev

dev: ## Run both backend and frontend in development mode (requires tmux or separate terminals)
	@echo "$(YELLOW)Note: Run 'make dev-backend' and 'make dev-frontend' in separate terminals$(NC)"

##@ Testing

test: test-backend test-frontend ## Run all tests (backend + frontend)

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	poetry run pytest
	@echo "$(GREEN)✓ Backend tests passed$(NC)"

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd frontend && npm test -- --run
	@echo "$(GREEN)✓ Frontend tests passed$(NC)"

test-watch-backend: ## Run backend tests in watch mode
	poetry run pytest -f

test-watch-frontend: ## Run frontend tests in watch mode
	cd frontend && npm test

test-coverage: test-coverage-backend test-coverage-frontend ## Generate test coverage reports

test-coverage-backend: ## Generate backend test coverage
	@echo "$(BLUE)Generating backend coverage...$(NC)"
	poetry run pytest --cov --cov-report=html --cov-report=term
	@echo "$(GREEN)✓ Backend coverage report generated in htmlcov/$(NC)"

test-coverage-frontend: ## Generate frontend test coverage
	@echo "$(BLUE)Generating frontend coverage...$(NC)"
	cd frontend && npm run coverage -- --run
	@echo "$(GREEN)✓ Frontend coverage report generated$(NC)"

##@ Linting

lint: lint-backend lint-frontend ## Run all linters (backend + frontend)

lint-backend: ## Run backend linters (ruff + mypy)
	@echo "$(BLUE)Linting backend code...$(NC)"
	poetry run ruff check .
	poetry run mypy api/
	@echo "$(GREEN)✓ Backend linting passed$(NC)"

lint-frontend: ## Run frontend linters (eslint + prettier check)
	@echo "$(BLUE)Linting frontend code...$(NC)"
	cd frontend && npm run lint
	cd frontend && npm run format:check
	cd frontend && npm run type-check
	@echo "$(GREEN)✓ Frontend linting passed$(NC)"

lint-fix: lint-fix-backend lint-fix-frontend ## Auto-fix linting issues

lint-fix-backend: ## Auto-fix backend linting issues
	@echo "$(BLUE)Fixing backend linting issues...$(NC)"
	poetry run ruff check . --fix
	@echo "$(GREEN)✓ Backend linting issues fixed$(NC)"

lint-fix-frontend: ## Auto-fix frontend linting issues
	@echo "$(BLUE)Fixing frontend linting issues...$(NC)"
	cd frontend && npm run lint:fix
	@echo "$(GREEN)✓ Frontend linting issues fixed$(NC)"

##@ Formatting

format: format-backend format-frontend ## Format all code (backend + frontend)

format-backend: ## Format backend code with black and isort
	@echo "$(BLUE)Formatting backend code...$(NC)"
	poetry run black .
	poetry run isort .
	@echo "$(GREEN)✓ Backend code formatted$(NC)"

format-frontend: ## Format frontend code with prettier
	@echo "$(BLUE)Formatting frontend code...$(NC)"
	cd frontend && npm run format
	@echo "$(GREEN)✓ Frontend code formatted$(NC)"

##@ Quality Checks

check: format lint test ## Run format, lint, and test (full quality check)
	@echo "$(GREEN)✓ All quality checks passed!$(NC)"

check-backend: format-backend lint-backend test-backend ## Run all backend quality checks
	@echo "$(GREEN)✓ Backend quality checks passed!$(NC)"

check-frontend: format-frontend lint-frontend test-frontend ## Run all frontend quality checks
	@echo "$(GREEN)✓ Frontend quality checks passed!$(NC)"

##@ Cache Management

cache-clear: ## Clear API cache
	@echo "$(BLUE)Clearing API cache...$(NC)"
	curl -X POST http://localhost:8000/cache/clear || echo "$(YELLOW)Note: API must be running$(NC)"

cache-info: ## Get API cache info
	@echo "$(BLUE)Fetching cache info...$(NC)"
	curl -s http://localhost:8000/cache/info | python -m json.tool || echo "$(YELLOW)Note: API must be running$(NC)"

##@ Build

build-frontend: ## Build frontend for production
	@echo "$(BLUE)Building frontend...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend built successfully$(NC)"

build: build-frontend ## Build all production assets

##@ Cleanup

clean: clean-backend clean-frontend ## Clean all generated files

clean-backend: ## Clean backend cache files
	@echo "$(BLUE)Cleaning backend cache...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov/ .coverage
	@echo "$(GREEN)✓ Backend cache cleaned$(NC)"

clean-frontend: ## Clean frontend build and cache files
	@echo "$(BLUE)Cleaning frontend cache...$(NC)"
	cd frontend && rm -rf dist/ node_modules/.vite/ .eslintcache
	@echo "$(GREEN)✓ Frontend cache cleaned$(NC)"

clean-all: clean ## Clean all files including dependencies
	@echo "$(BLUE)Cleaning all files...$(NC)"
	rm -rf .venv/
	cd frontend && rm -rf node_modules/
	@echo "$(GREEN)✓ All files cleaned$(NC)"

##@ Shortcuts

ci: check ## Run CI checks (format, lint, test)

pre-commit: format lint ## Run pre-commit checks (format + lint)

quick-check: lint-fix test ## Quick check: auto-fix linting and run tests
	@echo "$(GREEN)✓ Quick check completed!$(NC)"
