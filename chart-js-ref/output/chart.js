import Chart from 'chart.js/auto';
import { Colors } from 'chart.js/auto';
Chart.register(Colors);
const data = [
    { year: 2010, count: 10 },
    { year: 2011, count: 20 },
    { year: 2012, count: 15 },
    { year: 2013, count: 25 },
    { year: 2014, count: 22 },
    { year: 2015, count: 12 },
    { year: 2016, count: 25 },
];
const canvas = document.getElementById('myChart');
const options = {
    type: 'bar',
    data: {
        labels: data.map(row => row.year),
        datasets: [
            {
                label: 'One',
                data: data.filter(row => row.year > 2012).map(row => row.count)
            },
            {
                label: 'Two',
                data: [{ x: '', y: 20 }, { x: '', y: 19 }, { x: '', y: 10 }]
            },
            {
                label: 'Three',
                data: {
                    one: 1,
                    two: 2
                }
            }
        ]
    }
};
const pieOptions = {
    type: 'doughnut',
    data: {
        datasets: [{
                data: [10, 20, 30]
            }],
        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: [
            'Red',
            'Yellow',
            'Blue'
        ],
        options: {
            responsive: true,
            maintainAspectRatio: false // Allows for custom height and width
        }
    }
};
//@ts-ignore
new Chart(canvas, pieOptions);
