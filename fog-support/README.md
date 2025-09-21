This brings syntax highlighting,live analysis,hover information,autocompletions and go to definitions for the crown logic language.

- Please note that the live analysis is under development and may be buggy some times.So you may need to edit the same line twice to correct the analysis.

- Add this to your token color settings under textMateRules for the recommended highlighting
  
```json
    {
        "scope": "comment.line.crown", 
        "settings": {
            "foreground": "#69676C"
        }
    },
    {
        "scope": "constant.name.crown", 
        "settings": {
            "foreground": "#a6f5d1"
        }
    }, 
    {
        "scope": "constant.name.strict.crown",
        "settings": {
            "foreground": "#f1a671"
        }
    }, 
    {
        "scope": "constant.number.crown",  
        "settings": {
            "foreground": "#84cae8"
        }
    },
    {
        "scope": "terminator.and.crown",
        "settings": {
            "foreground": "#ee857e"
        }
    }, 
    {
        "scope": "constant.alias.crown",
        "settings": {
            "foreground": "#ee857e"
        }
    }, 
    {
        "scope": "constant.predicate.crown",  
        "settings": {
            "foreground": "#f0be8a"
        }
    }, 
    {
        "scope": "keyword.alias.crown", 
        "settings": {
            "foreground": "#ee857e"
        }
    }, 
    {
        "scope": "constant.plainword.crown",
        "settings": {
            "foreground": "#ffffff"
        }
    },
    {
        "scope": "terminator.crown", 
        "settings": {
            "foreground": "#ffc096"
        }
    }, 
    {
        "scope": "reference.crown", 
        "settings": {
            "foreground": "#ee857e"
        }
    }, 
    {
        "scope": "punctuation.crown", 
        "settings": {
            "foreground": "#ee857e"
        }
    }, 
    {
        "scope": "angle.brackets.crown",
        "settings": {
            "foreground": "#ffc096"
        }
    },
    {
        "scope": "punctuation.angle.begin.crown",
        "settings": {
            "foreground": "#e79090"
        }
    },
    {
        "scope": "punctuation.angle.end.crown",
        "settings": {
            "foreground": "#e79090"
        }
    },
```