<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KNReise - eksperimenter</title>
    </head>
    <body>
        <h1>KNREISE - eksperimenter</h1>
        <ul>{{ _.each(demonstrators, function (demonstrator) { }}
            <li><a href="{{= demonstrator.key }}.html">{{= demonstrator.name }}</a></li>{{ }) }}
        </ul>
    </body>
</html>