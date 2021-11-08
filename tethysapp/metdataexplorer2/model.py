from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Variables(Base):
    __tablename__ = 'variable'

    id = Column(Integer, primary_key=True)
    thredds_id = Column(Integer, ForeignKey('thredds.id'))
    thredds_servers = relationship("Thredds", back_populates="attributes")
    name = Column(String(100))
    units = Column(String(100))
    color = Column(String(100))
    range = Column(String(100))
    dimensions = Column(JSON)
    metadata_variable = Column(JSON)
    bounds = Column(JSON)

    def __init__(self, name, units, color, dimensions, metadata_variable, bounds):
        self.name = name
        self.dimensions = dimensions
        self.units = units
        self.color = color
        self.metadata_variable = metadata_variable
        self.bounds = bounds


class Thredds(Base):
    __tablename__ = 'thredds'

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey('groups.id'))
    group = relationship("Groups", back_populates="thredds_server")
    attributes = relationship("Variables", back_populates="thredds_servers", cascade="all, delete, delete-orphan")
    server_type = Column(String(100))
    title = Column(String(2000))
    url = Column(String(2000))
    url_wms = Column(String(2000))
    url_subset = Column(String(2000))
    epsg = Column(String(100))
    spatial = Column(String(2000))
    description = Column(String(4000))
    timestamp = Column(String(2000))
    authentication = Column(JSON)
    metadata_td_file = Column(JSON)
    extra_coordinate = Column(JSON)

    def __init__(self, server_type, title, url, url_wms, url_subset, epsg, spatial,
                 description, timestamp, authentication, metadata_td_file, extra_coordinate):
        self.server_type = server_type
        self.title = title
        self.url = url
        self.url_wms = url_wms
        self.url_subset = url_subset
        self.epsg = epsg
        self.spatial = spatial
        self.description = description
        self.timestamp = timestamp
        self.authentication = authentication
        self.metadata_td_file = metadata_td_file
        self.extra_coordinate = extra_coordinate


class Groups(Base):
    __tablename__ = 'groups'

    id = Column(Integer, primary_key=True)
    thredds_server = relationship("Thredds", back_populates="group", cascade="all,delete, delete-orphan")
    name = Column(String(100))
    description = Column(String(2000))

    def __init__(self, name, description):
        self.name = name
        self.description = description
