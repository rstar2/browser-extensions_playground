### For "content_scripts' tag - specifies in which apps/pages to "inject" the specific content scripts 

```json
"content_scripts": [
    {
      "run_at": "document_start",
      "matches": ["https://*.cnexusdev.com/*"],
      "js": ["script1.js", "script2.js"],
      "css": ["css/styles1.css", "css/styles2.css"]
    }
  ],
```

  "run_at" tells when to load the javascript, - document_start"/document_end/document_idle
  "matches" tells the URL to match to inject the code,
  "js" tells all .js files to inject,
  "css" tells about all included CSS files for injection

### For "web_accessible_resources" tag - specified which extension resources can be externally accessible

'web_accessible_resources' specify the path and format of files which the web page require to load from extension.
But why? because webpage and extension executes in isolated environments.They can't access one another's resources directly.
and in the following way we allow web page to access the required files from extension.

```json
"web_accessible_resources":["img/*.png"]
```
  
### For "externally_connectable" tag - specified which apps/pages can "connect" to the extension

```json
"externally_connectable": {
        "matches": [
            "*://*.cnexusdev.com/*",
            "*://*.komero.net/*",
            "https://share.fileflex.com/*"
        ]
  }
```


