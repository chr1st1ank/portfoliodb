from django.db import migrations


def load_actiontypes(apps, schema_editor):
    ActionType = apps.get_model('core', 'ActionType')
    # desired set of action types
    desired = [
        (1, 'Buy'),
        (3, 'Payout'),
        (2, 'Sell'),
    ]
    # remove any ActionType not in desired
    ActionType.objects.exclude(pk__in=[pk for pk, _ in desired]).delete()
    # ensure each desired entry exists with correct name
    for pk, name in desired:
        ActionType.objects.update_or_create(pk=pk, defaults={'name': name})


def reverse_load_actiontypes(apps, schema_editor):
    ActionType = apps.get_model('core', 'ActionType')
    # remove all seeded action types
    ActionType.objects.filter(pk__in=[1, 2, 3]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(load_actiontypes, reverse_load_actiontypes),
    ]