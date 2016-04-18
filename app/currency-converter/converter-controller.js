(function() {

    'use strict';

    angular
        .module('fxApp.exchangeRates')
        .controller("CurrencyConverterCtrl", CurrencyConverterCtrl);

    // Explicitly injecting required services, so the controller keep on running even after the code obfuscation.
    CurrencyConverterCtrl.$inject = ['$scope', 'CurrencyConverterService'];

    function CurrencyConverterCtrl($scope, CurrencyConverterService) {

        var defaults = {
            fromList: {},
            toList: {},
            from: "USD",
            to: "GBP,EUR,JPY,BRL",
            amount: 1.0,
            referenceRate: {
                GBP: 0,
                EUR: 0,
                JPY: 0,
                BRL: 0
            }
        };
        $scope.ui = {
            converting: false
        };
        $scope.currencyForm = angular.copy(defaults);
        $scope.onConvert = convert;
        $scope.onReset = reset;
        

        // get list of all available currencies
        CurrencyConverterService.getSupportedCurrencies().then(function(data) {
            $scope.currencyForm.fromList = angular.copy(data);
            $scope.currencyForm.toList = angular.copy(data);
        });
        convert($scope.currencyForm.from, $scope.currencyForm.to);

        function convert(from, to) {
            $scope.ui.converting = true;
            CurrencyConverterService.getReferenceRate(from, to).then(function(data) {
                $scope.currencyForm.referenceRate = data;
                $scope.ui.converting = false;
                $scope.$watch("currencyForm.amount", function(a, b) {
                    $scope.renderChart();
                });

            });
        }

        function reset() {
            $scope.currencyForm.amount = 1.0;
            $scope.currencyForm.to = "GBP,EUR,JPY,BRL";
        }

        
        $scope.renderChart = function() {
            var chartData = [{
                currency: 'GBP',
                value: $scope.currencyForm.amount * $scope.currencyForm.referenceRate.GBP
            }, {
                currency: 'EUR',
                value: $scope.currencyForm.amount * $scope.currencyForm.referenceRate.EUR
            }, {
                currency: 'JPY',
                value: $scope.currencyForm.amount * $scope.currencyForm.referenceRate.JPY
            }, {
                currency: 'BRL',
                value: $scope.currencyForm.amount * $scope.currencyForm.referenceRate.BRL
            }];
            barChart({
                chart: {
                    divID: "#barChart",
                    width: $("#barChart").width(),
                    height: 300
                },
                "seriesData": [ 
                    {
                        name: 'Currency',
                        data: chartData.map(function(m) {
                            return m.value;
                        })

                    }
                ],
                rawData: chartData,
                colors: ["#1893D3"]
            });
        };
    }
})();
