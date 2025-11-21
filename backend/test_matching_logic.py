#!/usr/bin/env python3
"""
Standalone test for job matching logic (no Firebase dependencies)
"""

def simple_job_matching(all_jobs, user):
    """
    Simple job matching based on title and location text matching.

    Special handling for IfYouCould:
    - IfYouCould uses company names as job titles (not job roles)
    - So we only filter by location, not by title

    :param all_jobs: Dictionary of jobs from all sources
    :param user: User dictionary
    :return: Matched jobs for the user
    """
    user_titles = [t.lower() for t in user.get('jobTitles', [])]
    user_locations = [l.lower() for l in user.get('jobLocations', [])]

    matched_jobs = []

    for source, source_jobs in all_jobs.items():
        for job in source_jobs:
            job_title = job.get('title', '').lower()
            job_location = job.get('location', '').lower()

            # Special handling for IfYouCould - only match on location
            # (their job titles are company names, not job roles)
            if source == 'ifyoucould':
                # For IfYouCould, only check location match
                location_match = any(loc in job_location for loc in user_locations)

                # Also accept "remote", "uk", or "united kingdom" jobs for any UK location
                if not location_match and any(loc in job_location for loc in ['remote', 'uk', 'united kingdom']):
                    location_match = any('uk' in user_loc or 'united kingdom' in user_loc for user_loc in user_locations)

                if location_match:
                    job_with_source = job.copy()
                    job_with_source['source'] = source
                    matched_jobs.append(job_with_source)
            else:
                # For other sources (LinkedIn, UN Jobs), match both title and location
                title_match = any(title in job_title for title in user_titles)
                location_match = any(loc in job_location for loc in user_locations)

                if title_match and location_match:
                    job_with_source = job.copy()
                    job_with_source['source'] = source
                    matched_jobs.append(job_with_source)

    print(f"User {user.get('email')} - Found {len(matched_jobs)} matched jobs")
    return matched_jobs


def run_tests():
    """Run comprehensive tests on the job matching logic"""

    print('🧪 TESTING JOB MATCHING LOGIC')
    print('=' * 70)
    print()

    # Sample user profile
    user = {
        'id': 'test-user-123',
        'email': 'jack@test.com',
        'jobTitles': ['graphic designer', 'ui designer'],
        'jobLocations': ['London, UK', 'Manchester']
    }

    print(f"👤 User Profile:")
    print(f"   Job Titles: {user['jobTitles']}")
    print(f"   Locations: {user['jobLocations']}")
    print()

    # Sample jobs from different sources
    all_jobs = {
        'linkedin': [
            {'title': 'Senior Graphic Designer', 'location': 'London, UK', 'url': 'https://linkedin.com/job1', 'company': 'Design Co'},
            {'title': 'UI Designer', 'location': 'Manchester, UK', 'url': 'https://linkedin.com/job2', 'company': 'Tech Ltd'},
            {'title': 'Web Developer', 'location': 'London, UK', 'url': 'https://linkedin.com/job3', 'company': 'Dev Corp'},
            {'title': 'Graphic Designer', 'location': 'Birmingham, UK', 'url': 'https://linkedin.com/job4', 'company': 'Studio'},
        ],
        'ifyoucould': [
            {'title': 'Acme Corporation Ltd', 'location': 'London, UK', 'url': 'https://ifyoucould.com/job1', 'company': 'Acme Corporation Ltd', 'salary': '£30k-40k'},
            {'title': 'Design Studio Inc', 'location': 'Remote', 'url': 'https://ifyoucould.com/job2', 'company': 'Design Studio Inc', 'salary': '£35k-45k'},
            {'title': 'Creative Agency', 'location': 'United Kingdom', 'url': 'https://ifyoucould.com/job3', 'company': 'Creative Agency', 'salary': '£40k-50k'},
            {'title': 'Tech Startup', 'location': 'Birmingham, UK', 'url': 'https://ifyoucould.com/job4', 'company': 'Tech Startup', 'salary': '£32k-42k'},
            {'title': 'Manchester Digital Ltd', 'location': 'Manchester, UK', 'url': 'https://ifyoucould.com/job5', 'company': 'Manchester Digital Ltd', 'salary': '£28k-38k'},
        ],
        'unjobs': [
            {'title': 'Graphic Designer - Communications', 'location': 'London, United Kingdom', 'url': 'https://un.org/job1', 'company': 'United Nations'},
            {'title': 'UI/UX Designer', 'location': 'Remote', 'url': 'https://un.org/job2', 'company': 'United Nations'},
        ]
    }

    print(f"📥 Input Jobs:")
    for source, jobs in all_jobs.items():
        print(f"   {source}: {len(jobs)} jobs")
    print()

    # Run matching
    print('🔄 Running job matching algorithm...')
    print()
    matched_jobs = simple_job_matching(all_jobs, user)

    print()
    print(f'✅ TOTAL MATCHED JOBS: {len(matched_jobs)}')
    print('=' * 70)
    print()

    # Categorize by source
    by_source = {}
    for job in matched_jobs:
        source = job.get('source', 'unknown')
        if source not in by_source:
            by_source[source] = []
        by_source[source].append(job)

    # Print results by source
    for source, jobs in by_source.items():
        print(f'📊 {source.upper()}: {len(jobs)} jobs matched')
        for job in jobs:
            title_preview = job['title'][:50] + '...' if len(job['title']) > 50 else job['title']
            print(f'   ✓ {title_preview}')
            print(f'     Location: {job["location"]}')
            if source == 'ifyoucould' and job.get('salary'):
                print(f'     Salary: {job["salary"]}')
        print()

    # Run specific tests
    print('=' * 70)
    print('🔬 RUNNING VALIDATION TESTS')
    print('=' * 70)
    print()

    test_results = []

    # Test 1: IfYouCould should match on location only (no title matching)
    print('Test 1: IfYouCould Location-Only Matching')
    ifyoucould_matched = [j for j in matched_jobs if j.get('source') == 'ifyoucould']
    expected_ifyoucould = 4  # London, Remote, UK-wide, Manchester
    passed = len(ifyoucould_matched) == expected_ifyoucould
    test_results.append(passed)

    print(f'   Expected: {expected_ifyoucould} jobs (London + Remote + UK + Manchester)')
    print(f'   Got: {len(ifyoucould_matched)} jobs')
    print(f'   Status: {"✅ PASS" if passed else "❌ FAIL"}')
    print(f'   Explanation: IfYouCould only matches by location, not title.')
    print(f'                Birmingham should NOT match (not in user locations).')
    print()

    # Test 2: LinkedIn should match on BOTH title AND location
    print('Test 2: LinkedIn Title + Location Matching')
    linkedin_matched = [j for j in matched_jobs if j.get('source') == 'linkedin']
    expected_linkedin = 2  # Graphic Designer in London, UI Designer in Manchester
    passed = len(linkedin_matched) == expected_linkedin
    test_results.append(passed)

    print(f'   Expected: {expected_linkedin} jobs')
    print(f'   Got: {len(linkedin_matched)} jobs')
    print(f'   Status: {"✅ PASS" if passed else "❌ FAIL"}')
    print(f'   Explanation: LinkedIn requires BOTH title and location to match.')
    print(f'                Web Developer (wrong title) should NOT match.')
    print(f'                Birmingham (wrong location) should NOT match.')
    print()

    # Test 3: UN Jobs should match on BOTH title AND location
    print('Test 3: UN Jobs Title + Location Matching')
    unjobs_matched = [j for j in matched_jobs if j.get('source') == 'unjobs']
    expected_unjobs = 1  # Only Graphic Designer in London
    passed = len(unjobs_matched) == expected_unjobs
    test_results.append(passed)

    print(f'   Expected: {expected_unjobs} job')
    print(f'   Got: {len(unjobs_matched)} jobs')
    print(f'   Status: {"✅ PASS" if passed else "❌ FAIL"}')
    print(f'   Explanation: UN Jobs requires BOTH title and location.')
    print(f'                Remote UN job should NOT match (location not in user prefs).')
    print()

    # Test 4: Total count
    print('Test 4: Total Match Count')
    expected_total = 7  # 2 LinkedIn + 4 IfYouCould + 1 UN
    passed = len(matched_jobs) == expected_total
    test_results.append(passed)

    print(f'   Expected: {expected_total} total matches')
    print(f'   Got: {len(matched_jobs)} total matches')
    print(f'   Status: {"✅ PASS" if passed else "❌ FAIL"}')
    print()

    # Final summary
    print('=' * 70)
    if all(test_results):
        print('🎉 ALL TESTS PASSED! ✅')
        print()
        print('✅ LinkedIn: Correctly matches title + location')
        print('✅ UN Jobs: Correctly matches title + location')
        print('✅ IfYouCould: Correctly matches location only (not title)')
        print('✅ Remote/UK jobs: Correctly matched for UK-based users')
        print()
        print('The job filtering logic is working perfectly! 🚀')
    else:
        print('⚠️  SOME TESTS FAILED')
        print()
        print(f'Passed: {sum(test_results)}/{len(test_results)}')
        print('Please review the test results above.')
    print('=' * 70)


if __name__ == '__main__':
    run_tests()
