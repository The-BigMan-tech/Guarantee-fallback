This brings syntax highlighting,live analysis and autocompletions for the fog logic language.

- Please note that the live analysis is under development and may be buggy some times.So you may need to edit the same line twice to correct the analysis.

- Add this to your token color settings under textMateRules for the recommended highlighting

```json
        {
            "scope": "constant.name.fog", 
            "settings": {
                "foreground": "#a6f5d1"
            }
        }, 
        {
            "scope": "constant.name.strict.fog",
            "settings": {
                "foreground": "#f1a671"
            }
        }, 
        {
            "scope": "constant.number.fog",  
            "settings": {
                "foreground": "#84cae8"
            }
        },
        {
            "scope": "constant.alias.fog",
            "settings": {
                "foreground": "#ee857e"
            }
        }, 
        {
            "scope": "constant.predicate.fog",  
            "settings": {
                "foreground": "#f0be8a"
            }
        }, 
        {
            "scope": "keyword.alias.fog", 
            "settings": {
                "foreground": "#ee857e"
            }
        }, 
        {
            "scope": "constant.plainword.fog",
            "settings": {
                "foreground": "#ffffff"
            }
        },
        {
            "scope": "terminator.fog", 
            "settings": {
                "foreground": "#ffc096"
            }
        }, 
        {
            "scope": "reference.fog", 
            "settings": {
                "foreground": "#bcf7ee"
            }
        }, 
        {
            "scope": "punctuation.fog", 
            "settings": {
                "foreground": "#ee857e"
            }
        }, 
        {
            "scope": "angle.brackets.fog",
            "settings": {
                "foreground": "#ffc096"
            }
        },
        {
            "scope": "punctuation.angle.begin.fog",
            "settings": {
                "foreground": "#e79090"
            }
        },
        {
            "scope": "punctuation.angle.end.fog",
            "settings": {
                "foreground": "#e79090"
            }
        },
```