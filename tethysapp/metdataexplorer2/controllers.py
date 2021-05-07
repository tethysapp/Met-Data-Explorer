from django.shortcuts import render
from tethys_sdk.permissions import login_required, permission_required, has_permission

from .app import Metdataexplorer2 as app

@login_required()
def home(request):
    """
    Controller for the app home page.
    """


    context = {
        'can_delete_groups': has_permission(request, 'delete_groups'),
        'can_add_groups': has_permission(request, 'add_groups'),
    }

    return render(request, 'metdataexplorer2/home.html', context)
