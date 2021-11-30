import os

from django.http import JsonResponse


def write_new_engine(request):
    machine = request.GET.get('machine')
    user = request.GET.get('user')
    pswd = request.GET.get('pswd')
    message = {}
    file = open(os.path.expanduser('~') + '/.netrc', 'a+')
    lines = file.readlines()
    if len(lines) == 0:
        file.write('machine ' + machine + ' login ' + user + ' password ' + pswd + '\n')
    elif lines[-1] == '\n':
        file.write('machine ' + machine + ' login ' + user + ' password ' + pswd + '\n')
    else:
        file.write('machine ' + machine + ' login ' + user + ' password ' + pswd + '\n')

    file.close()

    message['message'] = 'Authentication Successfully Added'
    return JsonResponse(message)


def remove_credentials(request):
    machine = request.GET.get('machine')
    user = request.GET.get('user')
    pswd = request.GET.get('pswd')
    line = int(request.GET.get('line'))

    message = {}
    string_to_remove = 'machine ' + machine + ' login ' + user + ' password ' + pswd + '\n'
    file = open(os.path.expanduser('~') + '/.netrc', 'r+')
    lines = file.readlines()
    lines.remove(string_to_remove)
    file.close()

    new_file = open(os.path.expanduser('~') + '/.netrc', 'w')
    for line in lines:
        new_file.write(line)

    new_file.close()

    message['message'] = 'Authentication Successfully Added'
    return JsonResponse(message)


def get_credentials(request):
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
            machine = line[pos1:pos2]
            user = line[pos3:pos4]
            pswd = line[pos5:].strip()

            auth[x] = (machine, user, pswd, x)
        x += 1

    file.close()

    return JsonResponse(auth)
