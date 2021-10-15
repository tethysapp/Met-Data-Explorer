import os
import netrc


def write_new_engine(machine, user, pswd):
    file = open(os.path.expanduser('~') + '/.netrc', 'a+')
    file.write('\nmachine ' + machine + ' login ' + user + ' password ' + pswd)
    file.close


def get_authentication():
    file = open(os.path.expanduser('~') + '/.netrc', 'r')
    lines = file.readlines()
    auth = {}
    x = 1

    for line in lines:
        if line[:8] == 'machine ':
            pos1 = 8
            pos2 = line.find(' login ')
            pos3 = pos2 + 7
            pos4 = line.find(' password ')
            pos5 = pos4 + 10
            machine = line[8:pos2]
            user = line[pos3:pos4]
            pswd = line[pos5:].strip()

            auth[x] = (machine, user, pswd)
        x += 1

    print(auth)


get_authentication()