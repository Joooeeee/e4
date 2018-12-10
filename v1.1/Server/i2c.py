import smbus
import time
import sys
import random
from gpiozero import LED

bus = smbus.SMBus(1)
led = LED(17)
bToggle=0

# This is the address we setup in the Arduino Program
address = 0x04

def writeNumber(value):
    bus.write_byte(address, value)
    return -1

def readNumber():
    try:
        number = bus.read_i2c_block_data(address,0,25)
        if number[0] !=0:
            if bToggle:
                led.on()
            else:
                led.off();
        #number = random.random()
        _thestring = '';
        for i in number:
            _thestring+=chr(i)
        return _thestring#chr(number[4])+chr(number[5])+chr(number[6])+chr(number[7])+chr(number[8])+chr(number[9])
    except:
        print (sys.exc_info())


while True:

    bToggle=not(bToggle)

    time.sleep(0.1)

    number = readNumber()

    #print "Arduino:  ", number
    try:

        sys.stdout.write("Data: "+number)
        sys.stdout.flush()

    except:
        print ("error!")
