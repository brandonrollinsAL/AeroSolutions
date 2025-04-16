#!/bin/bash

# Elevion Testing Suite Runner
# This script provides a convenient way to run the various test suites
# developed for the Elevion platform.

# Create logs directory if it doesn't exist
mkdir -p logs

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}    Elevion Testing Suite Runner    ${NC}"
echo -e "${BLUE}=================================${NC}"
echo

# Show test menu
show_menu() {
  echo -e "${YELLOW}Available Test Suites:${NC}"
  echo -e "${GREEN}1.${NC} Run All Tests"
  echo -e "${GREEN}2.${NC} Run Comprehensive Tests"
  echo -e "${GREEN}3.${NC} Run Popup Routes Tests"
  echo -e "${GREEN}0.${NC} Exit"
  echo
  echo -n "Enter your choice (0-3): "
}

# Run tests based on user selection
run_tests() {
  case $1 in
    1)
      echo -e "\n${BLUE}Running All Tests...${NC}\n"
      npx tsx server/scripts/runAllTests.ts
      ;;
    2)
      echo -e "\n${BLUE}Running Comprehensive Tests...${NC}\n"
      npx tsx server/scripts/runComprehensiveTests.ts
      ;;
    3)
      echo -e "\n${BLUE}Running Popup Routes Tests...${NC}\n"
      npx tsx server/scripts/testPopupRoutes.ts
      ;;
    *)
      echo -e "\n${RED}Invalid selection${NC}"
      ;;
  esac
}

# Main function
main() {
  if [ "$1" != "" ]; then
    # If argument provided, run specific test
    run_tests $1
  else
    # Interactive mode
    show_menu
    read choice
    if [ "$choice" == "0" ]; then
      echo -e "\n${BLUE}Exiting...${NC}"
      exit 0
    fi
    run_tests $choice
  fi
  
  # Show results location
  echo -e "\n${GREEN}Test complete!${NC}"
  echo -e "Test results are saved in the ${YELLOW}logs/${NC} directory."
}

# Call main function with command line argument
main $1

exit 0