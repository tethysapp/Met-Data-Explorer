from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Variables(Base):
    __tablename__ = 'variable'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    thredds_id = Column(Integer, ForeignKey('thredds.id'))
    dimensions = Column(JSON)
    units = Column(String(100))
    color = Column(String(100))
    range = Column(String(100))
    thredds_servers = relationship("Thredds", back_populates="attributes")
    metadata_variable = Column(JSON)
    auth_machine = Column(String(2000))
    auth_user = Column(String(2000))
    auth_pswd = Column(String(2000))

    def __init__(self, name, dimensions, units, color, metadata_variable, auth_machine, auth_user, auth_password):
        self.name = name
        self.dimensions = dimensions
        self.units = units
        self.color = color
        self.metadata_variable = metadata_variable
        self.auth_machine = auth_machine
        self.auth_user = auth_user
        self.auth_pswd = auth_password


class Thredds(Base):
    __tablename__ = 'thredds'

    id = Column(Integer, primary_key=True)
    server_type = Column(String(100))
    group_id = Column(Integer, ForeignKey('groups.id'))
    group = relationship("Groups", back_populates="thredds_server")
    title = Column(String(2000))
    url = Column(String(2000))
    url_wms = Column(String(2000))
    url_subset = Column(String(2000))
    epsg = Column(String(100))
    spatial = Column(String(2000))
    description = Column(String(4000))
    attributes = relationship("Variables", back_populates="thredds_servers", cascade="all,delete, delete-orphan")
    timestamp = Column(String(2000))
    metadata_td_file = Column(JSON)
    extra_coordinate = Column(JSON)


    def __init__(self, server_type, title, url, url_wms, url_subset, epsg, spatial, description, timestamp,
                 metadata_td_file, extra_coordinate):
        self.server_type = server_type
        self.title = title
        self.url = url
        self.url_wms = url_wms
        self.url_subset = url_subset
        self.epsg = epsg
        self.spatial = spatial
        self.description = description
        self.timestamp = timestamp
        self.metadata_td_file = metadata_td_file
        self.extra_coordinate = extra_coordinate


class Groups(Base):
    __tablename__ = 'groups'

    id = Column(Integer, primary_key=True)  # Record number.
    name = Column(String(100))
    description = Column(String(2000))
    thredds_server = relationship("Thredds", back_populates="group", cascade="all,delete, delete-orphan")

    def __init__(self, name, description):
        self.name = name
        self.description = description
