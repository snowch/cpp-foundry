#include <cmath>
#include <iostream>
#include <limits>

int main() {
    double value=0.1+0.2;
    bool close=std::abs(value-0.3)<1e-12;
    auto nan=std::numeric_limits<double>::quiet_NaN();
    std::cout<<"close="<<close<<" finite_nan="<<std::isfinite(nan)<<" self_equal="<<(nan==nan)<<"\n";
}
