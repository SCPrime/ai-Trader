#!/usr/bin/env python3
"""
Test runner script for AI Trading Bot.
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print('='*60)

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False


def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description='AI Trading Bot Test Runner')
    parser.add_argument('--unit', action='store_true', help='Run unit tests only')
    parser.add_argument('--integration', action='store_true', help='Run integration tests only')
    parser.add_argument('--slow', action='store_true', help='Include slow tests')
    parser.add_argument('--coverage', action='store_true', help='Generate coverage report')
    parser.add_argument('--parallel', action='store_true', help='Run tests in parallel')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--specific', help='Run specific test file or pattern')
    parser.add_argument('--markers', help='Run tests with specific markers')

    args = parser.parse_args()

    # Base pytest command
    cmd = ['python', '-m', 'pytest']

    # Add verbosity
    if args.verbose:
        cmd.append('-v')

    # Add parallel execution
    if args.parallel:
        cmd.extend(['-n', 'auto'])

    # Add coverage
    if args.coverage:
        cmd.extend([
            '--cov=src',
            '--cov-report=html:htmlcov',
            '--cov-report=term-missing'
        ])

    # Add marker filters
    markers = []
    if args.unit:
        markers.append('unit')
    if args.integration:
        markers.append('integration')
    if args.slow:
        markers.append('slow')
    if args.markers:
        markers.append(args.markers)

    if markers:
        cmd.extend(['-m', ' or '.join(markers)])
    elif not args.slow:
        # Exclude slow tests by default
        cmd.extend(['-m', 'not slow'])

    # Add specific test file/pattern
    if args.specific:
        cmd.append(args.specific)

    # Run the tests
    success = run_command(cmd, "Running Tests")

    if not success:
        print("\n❌ Tests failed!")
        return 1

    print("\n✅ All tests passed!")

    # Generate additional reports if requested
    if args.coverage:
        print(f"\n📊 Coverage report generated in: {Path.cwd() / 'htmlcov' / 'index.html'}")

    return 0


if __name__ == '__main__':
    sys.exit(main())