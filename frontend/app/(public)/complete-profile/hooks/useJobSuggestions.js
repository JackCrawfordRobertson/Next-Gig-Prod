"use client";

import { useMemo } from "react";

// Common job titles database for autocomplete suggestions
const JOB_TITLES = [
  // Tech & IT
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "React Developer", "Node.js Developer", "Python Developer", "Java Developer",
  "Web Developer", "Mobile Developer", "iOS Developer", "Android Developer",
  "DevOps Engineer", "Cloud Architect", "Data Engineer", "Data Scientist",
  "Machine Learning Engineer", "AI Engineer", "QA Engineer", "Test Engineer",
  "Security Engineer", "Systems Administrator", "Database Administrator", "IT Manager",

  // Business & Management
  "Product Manager", "Project Manager", "Business Analyst", "Business Manager",
  "Operations Manager", "Sales Manager", "Account Manager", "Client Manager",
  "Team Lead", "Engineering Manager", "Director", "Executive",

  // Marketing & Sales
  "Marketing Manager", "Digital Marketer", "Content Marketing Manager", "SEO Specialist",
  "Social Media Manager", "Brand Manager", "Sales Executive", "Sales Representative",
  "Account Executive", "Business Development Manager", "Marketing Consultant",

  // Design
  "UI Designer", "UX Designer", "Product Designer", "Graphic Designer",
  "Web Designer", "Interaction Designer", "Visual Designer", "Design Director",

  // Finance & Accounting
  "Accountant", "Financial Analyst", "Finance Manager", "CFO",
  "Bookkeeper", "Tax Consultant", "Auditor", "Investment Analyst",

  // Human Resources
  "HR Manager", "HR Specialist", "Recruiter", "Talent Acquisition",
  "HR Coordinator", "Compensation & Benefits", "Training Manager",

  // Customer Service
  "Customer Support", "Customer Service Representative", "Support Engineer",
  "Technical Support", "Help Desk", "Customer Success Manager",

  // Administrative
  "Administrative Assistant", "Executive Assistant", "Office Manager",
  "Receptionist", "Data Entry", "Legal Assistant",

  // Education
  "Teacher", "Professor", "Instructor", "Tutor", "Educator",
  "Curriculum Developer", "Learning Specialist",

  // Healthcare
  "Nurse", "Doctor", "Physician", "Healthcare Manager",
  "Medical Assistant", "Healthcare IT",

  // Other Popular Roles
  "Consultant", "Analyst", "Specialist", "Coordinator",
  "Representative", "Officer", "Technician", "Operator",
];

/**
 * Hook for job title suggestions
 * Filters job titles based on input and provides autocomplete suggestions
 */
export function useJobSuggestions(inputValue = "") {
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 1) {
      return [];
    }

    const lowerInput = inputValue.toLowerCase().trim();

    // Filter titles based on input
    return JOB_TITLES.filter((title) =>
      title.toLowerCase().startsWith(lowerInput) ||
      title.toLowerCase().includes(lowerInput)
    )
      .sort((a, b) => {
        // Prioritize titles that start with the input
        const aStartsWith = a.toLowerCase().startsWith(lowerInput);
        const bStartsWith = b.toLowerCase().startsWith(lowerInput);
        if (aStartsWith !== bStartsWith) {
          return aStartsWith ? -1 : 1;
        }
        // Then sort alphabetically
        return a.localeCompare(b);
      })
      .slice(0, 8); // Limit to 8 suggestions
  }, [inputValue]);

  return suggestions;
}
