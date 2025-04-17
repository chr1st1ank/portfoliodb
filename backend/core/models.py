from django.db import models


class ActionType(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID')
    name = models.CharField(max_length=10, db_column='Name')

    class Meta:
        db_table = 'ActionType'


class Investment(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID')
    name = models.TextField(null=True, db_column='Name')
    isin = models.CharField(max_length=20, null=True, db_column='ISIN')
    short_name = models.CharField(max_length=30, null=True, db_column='ShortName')

    class Meta:
        db_table = 'Investment'


class InvestmentPrice(models.Model):
    date = models.DateField(null=True, db_column='Date')
    investment = models.ForeignKey(
        Investment,
        on_delete=models.DO_NOTHING,
        db_column='InvestmentID',
        null=True,
    )
    price = models.DecimalField(max_digits=10, decimal_places=4, null=True, db_column='Price')
    source = models.CharField(max_length=20, null=True, db_column='Source')

    class Meta:
        db_table = 'InvestmentPrice'


class Movement(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID')
    date = models.DateField(null=True, db_column='Date')
    action = models.ForeignKey(
        ActionType,
        on_delete=models.DO_NOTHING,
        db_column='ActionID',
        null=True,
    )
    investment = models.ForeignKey(
        Investment,
        on_delete=models.DO_NOTHING,
        db_column='InvestmentID',
        null=True,
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=4, null=True, db_column='Quantity')
    amount = models.DecimalField(max_digits=10, decimal_places=4, null=True, db_column='Amount')
    fee = models.DecimalField(max_digits=10, decimal_places=4, null=True, db_column='Fee')

    class Meta:
        db_table = 'Movement'


class Development(models.Model):
    investment = models.ForeignKey(
        Investment,
        on_delete=models.DO_NOTHING,
        db_column='InvestmentID',
        null=True,
    )
    date = models.DateField(null=True, db_column='Date')
    price = models.DecimalField(max_digits=14, decimal_places=8, null=True, db_column='Price')
    quantity = models.DecimalField(max_digits=37, decimal_places=8, null=True, db_column='Quantity')
    value = models.DecimalField(max_digits=51, decimal_places=16, null=True, db_column='Value')

    class Meta:
        db_table = 'Development'