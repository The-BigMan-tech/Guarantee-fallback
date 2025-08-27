### Add this to your token color settings under textMateRules for the recommended highliting

```json
    {
            "scope": "constant.name.fog", 
            "settings": {
                "foreground": "#95ebc4"
            }
        }, 
        {
            "scope": "constant.name.strict.fog",
            "settings": {
                "foreground": "#f17171"
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
                "foreground": "#ecb38d"
            }
        }, 
        {
            "scope": "constant.predicate.fog",  
            "settings": {
                "foreground": "#e79090"
            }
        }, 
        {
            "scope": "keyword.alias.fog", 
            "settings": {
                "foreground": "#ffc096"
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
                "foreground": "#b3f2e9"
            }
        }, 
        {
            "scope": "punctuation.fog", 
            "settings": {
                "foreground": "#ffc096"
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

### Also add this to code runner extension settings under executorMapByFileExtension to directly resolve fog files from the gui:

".fog" : "fog resolve --src"