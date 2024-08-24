#include<iostream>
#include <unistd.h>
#include <sys/wait.h>
#include <cstdlib>
using namespace std;

int main() {
    for (int i = 0; i < 10; i++){
        if (pid == 0) {
            system("ping -t 192.168.100.114"); // Replace 8.8.8.8 with the IP address you want to ping
        }
    }
    return 0;
}