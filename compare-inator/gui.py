import tkinter as tk
from tkinter import *
from tkinter import filedialog as fd
import os
import index
from tkinter import messagebox

# Create an instance of Tkinter Frame and create global variable to store folders
# Not a fan of global variables
window = tk.Tk()
folders = {1: [], 2: []}

# Center Window on Screen
def center_screen():
    global screen_height, screen_width, x_coor, y_coor
    window_height = 200
    window_width = 1000
    
    screen_width = window.winfo_screenwidth()
    screen_height = window.winfo_screenheight()

    x_coor = int((screen_width/2) - (window_width/2))
    y_coor = int((screen_height/2) - (window_height/2))

    # Define the geometry
    window.geometry(f"{window_width}x{window_height}+{x_coor}+{y_coor}")
    window.title("THE COMPARE-INATOR")

# Save folder name and path name based on which event is triggered by btn press
def BrowseDirectories(event):
    number = event[-1]
    directory = fd.askdirectory(initialdir=os.getcwd(), title="Choose a folder")
    daList = directory.split("/")
    daString = f"Folder_{number}: \{daList[-1]}"
    folders[int(number)] = [directory, daList[-1]]
    
    if number == "1":
        folder1.configure(text=daString)
    elif number == "2":
        folder2.configure(text=daString)

    if folders[1] != [] and folders[2] != []:
        action_button.configure(state=NORMAL)

def Run():
    folder1_list = index.GetAllInFolder(folders[1][0])
    folder2_list = index.GetAllInFolder(folders[2][0])

    differences = index.CompareLists(folder1_list, folder2_list)

    index.ToCSV(differences, folders[1][1], folders[2][1])

    # Should probably error handle this message, but I doubt this will break
    # FUTURE JON FIX HERE IF THERE ARE ERRORS WE DID NOT ANTICIPATE
    res = messagebox.askquestion("Close-inator", "Success!\nClose Program?")
    if res == "yes":
        window.destroy()
    else:
        folders[1] = []
        folders[2] = []
        folder1.configure(text="Folder_1: ____________________________________")
        folder2.configure(text="Folder_2: ____________________________________")
        action_button.configure(state=DISABLED)

sub_container_left = Frame(window, padx=10, pady=10, width=400)
sub_container_middle = Frame(window, pady=75, width=200)
sub_container_right = Frame(window, padx=10, pady=10, width=400)

# subContainerLeft Contents
text = "Folder_1: ____________________________________"
folder1 = Label(sub_container_left, text = text,)
folder1.pack(in_=sub_container_left, side=TOP)
folder1Button = Button(sub_container_left, text='Browse Folders', command=lambda *args: BrowseDirectories("btn1"))
folder1Button.pack(in_=sub_container_left, side=TOP)

# subContainerMiddle
action_button = Button(sub_container_middle, text='Run', state=DISABLED, command=lambda *args: Run())
action_button.pack(in_=sub_container_middle, side=TOP)

# subContainerRight Contents
text = "Folder_2: ____________________________________"
folder2 = Label(sub_container_right, text =  text)
folder2.pack(in_=sub_container_right, side=TOP)
folder2Button = Button(sub_container_right, text='Browse Folders', command=lambda *args: BrowseDirectories("btn2"))
folder2Button.pack(in_=sub_container_right, side=TOP)

sub_container_left.pack(side=LEFT, fill=BOTH, expand=True)
sub_container_left.propagate(0)
sub_container_middle.pack(side=LEFT, fill=BOTH, expand=True)
sub_container_middle.propagate(0)
sub_container_right.pack(side=RIGHT, fill=BOTH, expand=True)
sub_container_right.propagate(0)

center_screen()
window.mainloop()