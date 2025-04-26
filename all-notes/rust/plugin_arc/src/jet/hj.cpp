#include <iostream>

double calculateAverage(const double* arr, int size) {
    if (size <= 0) {
        return 0.0; // Return 0 for empty arrays
    }
    double sum = 0.0;
    for (int i = 0; i < size; ++i) {
        sum += arr[i];
    }
    return sum / size;
}

int main() {
    double numbers[] = {10.5, 20.0, 30.5, 40.0, 50.5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    
    double average = calculateAverage(numbers, size);
    std::cout << "Average: " << average
};