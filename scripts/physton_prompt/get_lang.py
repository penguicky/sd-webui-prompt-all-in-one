# Hardcoded English translations for backend error messages
_translations = {
    'is_required': '{0} is required',
    'is_not_dict': '{0} is not a dict',
    'install_success': 'Successfully installed {0}',
    'install_failed': 'Failed to install {0}',
}


def replace_vars(text, vars):
    for key, value in vars.items():
        text = text.replace("{" + key + "}", value)
    return text


def get_lang(key, vars={}):
    text = _translations.get(key, key)
    if vars:
        return replace_vars(text, vars)
    return text
