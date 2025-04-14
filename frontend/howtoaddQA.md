## Adding Individual Testers
To add a single tester, use this command from your project root:

```bash
node scripts/manageTester.js add email@example.com "Optional notes about this tester"
```

For example:

node scripts/manageTester.js add john@example.com "QA Team Lead"
Adding Multiple Testers at Once

```bash
Create a text file with one email per line:
```

# testers.txt - lines starting with # are ignored
jane@example.com
michael@example.com
sarah@example.com

Import all emails from the file:

```bash
node scripts/manageTester.js import testers.txt
```

Viewing Current Testers
To see all testers currently in the system:

```bash
node scripts/manageTester.js list
```

This will display:

Email address of each tester
When they were added
Any notes you included

Removing Testers
If you need to remove a tester:

```bash
node scripts/manageTester.js remove email@example.com
```

node scripts/manageTester.js add ewanturner180@hotmail.com "Adding Ewan as a QA User"
node scripts/manageTester.js add cjcasola@gmail.com "Adding Connor as a QA User"
node scripts/manageTester.js add lucia@klander.com "Adding lucia as a QA User"
node scripts/manageTester.js add james.mackenzie1999@gmail.com "Adding james as a QA User"



node scripts/manageTester.js add jack@ya-ya.co.uk "Adding Jack as a QA User"



