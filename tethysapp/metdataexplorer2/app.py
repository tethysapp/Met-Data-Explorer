from tethys_sdk.base import TethysAppBase, url_map_maker
from tethys_sdk.permissions import Permission, PermissionGroup

class Metdataexplorer2(TethysAppBase):
    """
    Tethys app class for Met dataexplorer.
    """

    name = 'Met Data Explorer'
    index = 'metdataexplorer2:home'
    icon = 'metdataexplorer2/images/bananero.png'
    package = 'metdataexplorer2'
    root_url = 'metdataexplorer2'
    color = '#2980b9'
    description = ''
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='metdataexplorer2',
                controller='metdataexplorer2.controllers.home'
            ),
            UrlMap(
                name='getFilesAndFolders',
                url='getFilesAndFolders/',
                controller='metdataexplorer2.groups.get_files_and_folders'
            ),
            UrlMap(
                name='getVariablesAndFileMetadata',
                url='getVariablesAndFileMetadata/',
                controller='metdataexplorer2.groups.get_variables_and_file_metadata'
            ),
        )

        return url_maps

    def permissions(self):

        # Viewer Permissions
        delete_groups = Permission(
            name = 'delete_groups',
            description = 'Delete a Thredds group from the App',
        )
        # Viewer Permissions
        add_groups = Permission(
            name = 'add_groups',
            description = 'Add a Thredds group to the App'
        )
        admin = PermissionGroup(
            name='admin',
            permissions=(delete_groups,add_groups)
        )


        permissions = (admin, )

        return permissions
