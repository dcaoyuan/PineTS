---
layout: default
title: Array
parent: API Coverage
---

## Array

### Creation

| Function               | Status | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `array.new_bool()`     | ✔️     | Create boolean array         |
| `array.new_box()`      |        | Create box array             |
| `array.new_color()`    |        | Create color array           |
| `array.new_float()`    | ✔️     | Create float array           |
| `array.new_int()`      | ✔️     | Create int array             |
| `array.new_label()`    |        | Create label array           |
| `array.new_line()`     |        | Create line array            |
| `array.new_linefill()` |        | Create linefill array        |
| `array.new_string()`   | ✔️     | Create string array          |
| `array.new_table()`    |        | Create table array           |
| `array.new<type>()`    | ✔️     | Create typed array (generic) |
| `array.from()`         | ✅     | Create array from arguments  |
| `array.copy()`         | ✅     | Create copy of array         |

### Stack & Queue Operations

| Function          | Status | Description                  |
| ----------------- | ------ | ---------------------------- |
| `array.push()`    | ✅     | Append element to end        |
| `array.pop()`     | ✅     | Remove last element          |
| `array.unshift()` | ✅     | Prepend element to beginning |
| `array.shift()`   | ✅     | Remove first element         |
| `array.insert()`  | ✅     | Insert element at index      |
| `array.remove()`  | ✅     | Remove element at index      |
| `array.clear()`   | ✅     | Remove all elements          |

### Access & Information

| Function        | Status | Description           |
| --------------- | ------ | --------------------- |
| `array.get()`   | ✅     | Get value at index    |
| `array.set()`   | ✅     | Set value at index    |
| `array.first()` | ✅     | Get first element     |
| `array.last()`  | ✅     | Get last element      |
| `array.fill()`  | ✅     | Fill array with value |
| `array.size()`  | ✅     | Get array size        |

### Search & Lookup

| Function                          | Status | Description               |
| --------------------------------- | ------ | ------------------------- |
| `array.includes()`                | ✅     | Check if value exists     |
| `array.indexof()`                 | ✅     | Find first index of value |
| `array.lastindexof()`             | ✅     | Find last index of value  |
| `array.binary_search()`           | ✅     | Binary search             |
| `array.binary_search_leftmost()`  | ✅     | Binary search (leftmost)  |
| `array.binary_search_rightmost()` | ✅     | Binary search (rightmost) |

### Calculations & Statistics

| Function                                  | Status | Description               |
| ----------------------------------------- | ------ | ------------------------- |
| `array.sum()`                             | ✅     | Sum of elements           |
| `array.avg()`                             | ✅     | Average of elements       |
| `array.min()`                             | ✅     | Minimum value             |
| `array.max()`                             | ✅     | Maximum value             |
| `array.median()`                          | ✅     | Median value              |
| `array.mode()`                            | ✅     | Mode value                |
| `array.stdev()`                           | ✅     | Standard deviation        |
| `array.variance()`                        | ✅     | Variance                  |
| `array.covariance()`                      | ✅     | Covariance                |
| `array.standardize()`                     | ✅     | Standardize elements      |
| `array.range()`                           | ✅     | Range of values           |
| `array.abs()`                             | ✅     | Absolute values           |
| `array.percentrank()`                     | ✅     | Percentile rank           |
| `array.percentile_linear_interpolation()` | ✅     | Percentile (Linear)       |
| `array.percentile_nearest_rank()`         | ✅     | Percentile (Nearest Rank) |

### Manipulation & Logic

| Function               | Status | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `array.concat()`       | ✅     | Concatenate arrays           |
| `array.slice()`        | ✅     | Extract subarray             |
| `array.reverse()`      | ✅     | Reverse order                |
| `array.sort()`         | ✅     | Sort array                   |
| `array.sort_indices()` | ✅     | Get sorted indices           |
| `array.join()`         | ✅     | Join to string               |
| `array.every()`        | ✅     | Check if all elements match  |
| `array.some()`         | ✅     | Check if any element matches |
