# K6 Microservices Performance Testing Makefile
# Provides convenient commands for running tests on macOS and other Unix-like systems

.PHONY: help validate smoke load stress spike install-k6 clean setup

# Default target
help:
	@echo "K6 Microservices Performance Testing"
	@echo ""
	@echo "Available commands:"
	@echo "  make setup          - Setup the project (make script executable, install k6 if needed)"
	@echo "  make install-k6     - Install K6 using Homebrew (macOS only)"
	@echo "  make validate       - Validate all test scripts"
	@echo "  make smoke          - Run smoke tests on staging"
	@echo "  make smoke-prod     - Run smoke tests on production"
	@echo "  make load           - Run load tests on staging"
	@echo "  make load-prod      - Run load tests on production"
	@echo "  make stress         - Run stress tests on staging"
	@echo "  make stress-prod    - Run stress tests on production"
	@echo "  make spike          - Run spike tests on staging"
	@echo "  make spike-prod     - Run spike tests on production"
	@echo "  make clean          - Clean up results directory"
	@echo ""
	@echo "Options:"
	@echo "  VERBOSE=1           - Enable verbose output"
	@echo "  OPEN_RESULTS=1      - Open results directory after test"
	@echo ""
	@echo "Examples:"
	@echo "  make smoke VERBOSE=1"
	@echo "  make load OPEN_RESULTS=1"
	@echo "  make stress-prod VERBOSE=1 OPEN_RESULTS=1"

# Setup project
setup:
	@echo "Setting up K6 testing environment..."
	chmod +x workflows/run-tests-macos.sh
	@if command -v k6 >/dev/null 2>&1; then \
		echo "✓ K6 is already installed"; \
	else \
		echo "K6 not found. Installing..."; \
		make install-k6; \
	fi
	@echo "✓ Setup complete"

# Install K6 using Homebrew
install-k6:
	@if command -v brew >/dev/null 2>&1; then \
		echo "Installing K6 using Homebrew..."; \
		brew install k6; \
	else \
		echo "Homebrew not found. Please install Homebrew first:"; \
		echo "/bin/bash -c \"\$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""; \
		exit 1; \
	fi

# Build options for the shell script
SCRIPT_OPTIONS := 
ifdef VERBOSE
	SCRIPT_OPTIONS += --verbose
endif
ifdef OPEN_RESULTS
	SCRIPT_OPTIONS += --open-results
endif

# Validate all test scripts
validate:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh validate $(SCRIPT_OPTIONS)

# Smoke tests
smoke:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh smoke stage $(SCRIPT_OPTIONS)

smoke-prod:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh smoke prod $(SCRIPT_OPTIONS)

# Load tests
load:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh load stage $(SCRIPT_OPTIONS)

load-prod:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh load prod $(SCRIPT_OPTIONS)

# Stress tests
stress:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh stress stage $(SCRIPT_OPTIONS)

stress-prod:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh stress prod $(SCRIPT_OPTIONS)

# Spike tests
spike:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh spike stage $(SCRIPT_OPTIONS)

spike-prod:
	@chmod +x workflows/run-tests-macos.sh
	./workflows/run-tests-macos.sh spike prod $(SCRIPT_OPTIONS)

# Clean up results
clean:
	@echo "Cleaning up results directory..."
	@if [ -d "results" ]; then \
		rm -rf results/*; \
		echo "✓ Results directory cleaned"; \
	else \
		echo "Results directory doesn't exist"; \
	fi

# Quick test commands (with common options)
test-all: validate smoke load
	@echo "✓ All basic tests completed"

quick-test: validate smoke
	@echo "✓ Quick validation and smoke test completed"

# Development helpers
dev-setup: setup
	@echo "Setting up development environment..."
	@if [ ! -f ".env.stage" ]; then \
		cp .env.example .env.stage 2>/dev/null || echo "# Copy from .env.example and customize" > .env.stage; \
		echo "Created .env.stage - please customize it"; \
	fi
	@echo "✓ Development setup complete"

# Show current environment
env-info:
	@echo "Environment Information:"
	@echo "  OS: $$(uname -s)"
	@echo "  Architecture: $$(uname -m)"
	@if command -v k6 >/dev/null 2>&1; then \
		echo "  K6: $$(k6 version | head -n1)"; \
	else \
		echo "  K6: Not installed"; \
	fi
	@if command -v brew >/dev/null 2>&1; then \
		echo "  Homebrew: $$(brew --version | head -n1)"; \
	else \
		echo "  Homebrew: Not installed"; \
	fi
	@echo "  Shell: $$SHELL"
	@echo "  Available test files:"
	@for file in tests/*.js; do \
		if [ -f "$$file" ]; then \
			echo "    - $$(basename "$$file")"; \
		fi; \
	done

