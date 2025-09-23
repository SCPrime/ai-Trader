"""
Setup script for AI Trading Bot package installation.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README file
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding='utf-8')

# Read requirements
requirements = []
with open('requirements.txt', 'r', encoding='utf-8') as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]

setup(
    name="ai-trading-bot",
    version="1.0.0",
    author="AI Trading Bot Team",
    author_email="team@aitradingbot.com",
    description="Advanced AI-powered algorithmic trading bot with comprehensive risk management",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/your-username/ai-trading-bot",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Office/Business :: Financial :: Investment",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Environment :: Console",
        "Framework :: AsyncIO",
    ],
    python_requires=">=3.11",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=8.0.0",
            "pytest-asyncio>=0.24.0",
            "pytest-cov>=5.0.0",
            "pytest-mock>=3.14.0",
            "black>=24.0.0",
            "pylint>=3.0.0",
            "mypy>=1.8.0",
            "pre-commit>=3.6.0",
        ],
        "monitoring": [
            "prometheus-client>=0.19.0",
            "grafana-api>=1.0.3",
        ],
        "optimization": [
            "numba>=0.59.0",
            "cython>=3.0.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "ai-trading-bot=main:cli",
            "trading-bot=main:cli",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.yaml", "*.yml", "*.json", "*.txt"],
    },
    project_urls={
        "Bug Reports": "https://github.com/your-username/ai-trading-bot/issues",
        "Source": "https://github.com/your-username/ai-trading-bot",
        "Documentation": "https://github.com/your-username/ai-trading-bot/wiki",
    },
    keywords="trading, algorithmic-trading, ai, machine-learning, finance, stocks, crypto, risk-management",
    zip_safe=False,
)