from django.core.exceptions import ValidationError


def validate_schedule_structure(value):
    required_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    if not isinstance(value, dict):
        raise ValidationError("Schedule must be a JSON object.")
    for day in required_days:
        if day not in value:
            raise ValidationError(f"Missing '{day}' in schedule.")
        day_schedule = value[day]
        if not isinstance(day_schedule, dict):
            raise ValidationError(f"Schedule for '{day}' must be an object.")
        if "open" not in day_schedule or "close" not in day_schedule:
            raise ValidationError(f"'{day}' must have 'open' and 'close' keys.")
        for key in ("open", "close"):
            if not isinstance(day_schedule[key], str) or len(day_schedule[key]) != 5:
                raise ValidationError(f"'{key}' time must be a string in HH:MM format")
    return value
