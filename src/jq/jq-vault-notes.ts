// Curated from Obsidian vault: jq.md (78 lines)
// Note: jq.md in vault is the upstream project README (install instructions only).
// This file contains practical jq patterns curated from common usage.

export interface VaultNote {
  heading: string;
  body: string;
  tags?: string[];
  codeSnippet?: string;
}

export const JQ_VAULT_NOTES: VaultNote[] = [
  {
    heading: 'Core Filter Patterns',
    body: 'Essential jq patterns for everyday JSON processing.',
    tags: ['patterns', 'filters'],
    codeSnippet: `.                           # identity: output input unchanged
.foo                        # get field 'foo'
.foo.bar                    # nested field access
.foo?                       # optional: no error if .foo doesn't exist
.["key with spaces"]        # key with special characters
.[0]                        # first array element
.[-1]                       # last array element
.[2:5]                      # array slice (index 2 up to but not including 5)
.[]                         # iterate array or object values
keys                        # get array of keys
values                      # get array of values
length                      # length of array, object, or string
has("key")                  # test if key exists
in                          # test if value is in object/array`,
  },
  {
    heading: 'Select, Map & Reduce',
    body: 'Filtering and transforming arrays.',
    tags: ['patterns', 'arrays'],
    codeSnippet: `# Filter array elements:
.[] | select(.active == true)
.[] | select(.age > 18)
.[] | select(.name | startswith("A"))
.[] | select(.tags | contains(["prod"]))

# Map (transform each element):
map(.name)                  # extract field from each element
map(. * 2)                  # multiply each number by 2
map(select(.active))        # filter inline

# Reduce:
[.[] | select(.active)] | length    # count active items
[.[] | .age] | add                  # sum of ages
[.[] | .age] | add / length         # average age (careful: null if empty)
[.[] | .score] | max                # max value
[.[] | .score] | min                # min value`,
  },
  {
    heading: 'Object Construction & Transformation',
    body: 'Build new objects and reshape data.',
    tags: ['patterns', 'objects'],
    codeSnippet: `# Build new object:
{name: .name, age: .age}
{(.key): .value}            # dynamic key
{a, b}                      # shorthand for {a: .a, b: .b}

# Add/update fields:
. + {newField: "value"}
. | .status = "active"

# Remove fields:
del(.unwanted)
del(.a, .b)

# Rename fields:
{newName: .oldName} + del(.oldName)

# Group by field:
group_by(.category)

# Unique values:
[.[] | .category] | unique

# Sort:
sort_by(.name)
sort_by(.date) | reverse     # newest first`,
  },
  {
    heading: 'String Operations',
    body: 'String manipulation and interpolation in jq.',
    tags: ['patterns', 'strings'],
    codeSnippet: `# String interpolation:
"Hello \\(.name)!"
"\\(.first) \\(.last)"

# Split and join:
.csv | split(",")
["a","b","c"] | join(", ")

# Test:
.name | test("^[A-Z]")      # regex test
.url | startswith("https")
.name | endswith("ing")
.name | contains("foo")

# Case:
.name | ascii_downcase
.name | ascii_upcase

# Ltrimstr / rtrimstr:
.path | ltrimstr("/api/")
.file | rtrimstr(".json")`,
  },
  {
    heading: 'Paths, Env & I/O',
    body: 'Working with paths, environment variables, and multiple files.',
    tags: ['patterns', 'advanced'],
    codeSnippet: `# Path operations:
path(.foo.bar)              # returns ["foo","bar"]
getpath(["foo","bar"])      # same as .foo.bar
setpath(["foo"]; "val")     # set nested path
delpaths([["a"],["b"]])     # delete multiple paths

# Environment variables:
env.HOME                    # access $HOME
$ENV.PATH                   # access $PATH

# null handling:
.foo // "default"           # alternative: use "default" if .foo is null/false
.foo // empty               # suppress output if null

# Type checks:
type                        # "null","boolean","number","string","array","object"
numbers, strings, booleans, arrays, objects, nulls  # type filters
.[] | numbers               # select only numbers from array`,
  },
  {
    heading: 'Practical CLI Recipes',
    body: 'Useful jq one-liners for real-world JSON processing tasks.',
    tags: ['recipes', 'cli'],
    codeSnippet: `# Pretty print JSON:
cat data.json | jq .

# Extract and flatten:
jq -r '.items[].name' data.json    # -r for raw string output

# Convert JSON to CSV:
jq -r '.[] | [.id, .name, .email] | @csv' users.json

# Convert JSON to TSV:
jq -r '.[] | [.id, .name] | @tsv' users.json

# Compact output (no formatting):
jq -c . data.json

# Process multiple files:
jq -s '.[0] * .[1]' base.json override.json   # merge two objects

# From shell variable:
jq --arg name "$NAME" '.[] | select(.name == $name)' data.json

# From shell number:
jq --argjson limit 10 '.[] | select(.score > $limit)' data.json

# Null-safe field access in pipeline:
jq 'try .nested.field catch null' data.json`,
  },
];
